import { models } from "@b/db";
import { createError } from "@b/utils/error";
import {
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";

export const metadata: any = {
  summary: "Get NFT token details",
  operationId: "getNftToken",
  tags: ["Admin", "NFT"],
  permission: "view.nft.token",
  requiresAuth: true,
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
      description: "Token UUID",
    },
  ],
  responses: {
    200: { description: "NFT token details" },
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
    const token = await models.nftToken.findByPk(id, {
      include: [
        {
          model: models.nftCollection,
          as: "collection",
        },
        {
          model: models.nftCreator,
          as: "creator",
          include: [
            {
              model: models.user,
              as: "user",
              attributes: ["id", "firstName", "lastName", "email", "avatar"],
            },
          ],
        },
        {
          model: models.user,
          as: "owner",
          attributes: ["id", "firstName", "lastName", "email", "avatar"],
        },
        {
          model: models.nftListing,
          as: "listings",
          required: false,
        },
        {
          model: models.nftActivity,
          as: "activities",
          required: false,
          order: [["createdAt", "DESC"]],
          limit: 50,
        },
        {
          model: models.nftOffer,
          as: "offers",
          required: false,
        },
        {
          model: models.nftSale,
          as: "sales",
          required: false,
          order: [["createdAt", "DESC"]],
        },
        {
          model: models.nftReview,
          as: "reviews",
          required: false,
          order: [["createdAt", "DESC"]],
        },
        {
          model: models.nftPriceHistory,
          as: "priceHistory",
          required: false,
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!token) {
      throw createError({ statusCode: 404, message: "NFT token not found" });
    }

    return token;
  } catch (error: any) {
    if (error.statusCode === 404) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to fetch NFT token",
    });
  }
};
