import { models } from "@b/db";
import { createError } from "@b/utils/error";
import {
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import { Op } from "sequelize";

export const metadata: any = {
  summary: "Delete NFT token",
  operationId: "deleteNftToken",
  tags: ["Admin", "NFT"],
  permission: "delete.nft.token",
  requiresAuth: true,
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: {
        type: "string",
        format: "uuid",
      },
      description: "Token UUID",
    },
  ],
  responses: {
    200: {
      description: "Token deleted successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    401: unauthorizedResponse,
    403: { description: "Forbidden" },
    404: notFoundMetadataResponse("NFT token"),
    500: serverErrorResponse,
  },
};

export default async (data: Handler) => {
  const { params, user } = data;

  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const { id } = params;

  if (!id) {
    throw createError({ statusCode: 400, message: "Token ID is required" });
  }

  try {
    const token = await models.nftToken.findByPk(id);

    if (!token) {
      throw createError({ statusCode: 404, message: "NFT token not found" });
    }

    // Check for active listings
    const activeListings = await models.nftListing.count({
      where: {
        tokenId: id,
        status: "ACTIVE",
      },
    });

    if (activeListings > 0) {
      throw createError({
        statusCode: 400,
        message: "Cannot delete token with active listings. Cancel all listings first.",
      });
    }

    // Check for pending offers
    const pendingOffers = await models.nftOffer.count({
      where: {
        tokenId: id,
        status: "ACTIVE",
      },
    });

    if (pendingOffers > 0) {
      throw createError({
        statusCode: 400,
        message: "Cannot delete token with active offers. Resolve all offers first.",
      });
    }

    // Check for pending bids (through listings)
    const tokenListings = await models.nftListing.findAll({
      where: { tokenId: id },
      attributes: ["id"],
      raw: true,
    });

    if (tokenListings.length > 0) {
      const listingIds = tokenListings.map((l: any) => l.id);
      const pendingBids = await models.nftBid.count({
        where: {
          listingId: { [Op.in]: listingIds },
          status: { [Op.in]: ["ACTIVE"] },
        },
      });

      if (pendingBids > 0) {
        throw createError({
          statusCode: 400,
          message: "Cannot delete token with active bids. Resolve all bids first.",
        });
      }
    }

    // Create activity for the deletion (use BURN type as closest equivalent)
    await models.nftActivity.create({
      tokenId: id,
      collectionId: token.collectionId,
      type: "BURN",
      fromUserId: user.id,
      metadata: JSON.stringify({
        action: "admin_deletion",
        tokenName: token.name,
        adminId: user.id,
      }),
    });

    // Soft delete (paranoid model)
    await token.destroy();

    return {
      success: true,
      message: "NFT token deleted successfully",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to delete NFT token",
    });
  }
};
