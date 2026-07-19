import { models } from "@b/db";
import { createError } from "@b/utils/error";
import {
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";

export const metadata: any = {
  summary: "Delete NFT collection",
  operationId: "deleteNftCollection",
  tags: ["Admin", "NFT", "Collection"],
  permission: "delete.nft.collection",
  requiresAuth: true,
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
      description: "Collection UUID",
    },
  ],
  responses: {
    200: {
      description: "Collection deleted successfully",
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
    404: notFoundMetadataResponse("NFT collection"),
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
    throw createError({ statusCode: 400, message: "Collection ID is required" });
  }

  try {
    const collection = await models.nftCollection.findByPk(id);

    if (!collection) {
      throw createError({ statusCode: 404, message: "NFT collection not found" });
    }

    // Check for tokens in the collection with active listings
    const tokensWithActiveListings = await models.nftToken.count({
      include: [
        {
          model: models.nftListing,
          as: "listings",
          where: { status: "ACTIVE" },
          required: true,
        },
      ],
      where: { collectionId: id },
    });

    if (tokensWithActiveListings > 0) {
      throw createError({
        statusCode: 400,
        message: "Cannot delete collection with tokens that have active listings. Cancel all active listings first.",
      });
    }

    // Create activity for the collection deletion
    await models.nftActivity.create({
      collectionId: id,
      type: "BURN",
      fromUserId: user.id,
      metadata: JSON.stringify({
        action: "admin_collection_deletion",
        collectionName: collection.name,
        adminId: user.id,
      }),
    });

    // Delete collection (cascade should handle tokens, activities, etc.)
    await collection.destroy();

    return {
      success: true,
      message: "NFT collection deleted successfully",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to delete NFT collection",
    });
  }
};
