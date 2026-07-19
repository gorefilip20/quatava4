import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata = {
  summary: "Get recent activity",
  description: "Retrieves the recent NFT marketplace activity feed with optional filters.",
  operationId: "getRecentActivity",
  tags: ["NFT", "Activity"],
  parameters: [
    {
      name: "tokenId",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Filter by token ID",
    },
    {
      name: "collectionId",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Filter by collection ID",
    },
    {
      name: "type",
      in: "query",
      required: false,
      schema: {
        type: "string",
        enum: [
          "MINT",
          "TRANSFER",
          "SALE",
          "LIST",
          "DELIST",
          "BID",
          "OFFER",
          "BURN",
          "COLLECTION_CREATED",
          "COLLECTION_DEPLOYED",
          "AUCTION_ENDED",
        ],
      },
      description: "Filter by activity type",
    },
    {
      name: "limit",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 100 },
      description: "Number of results (default 20, max 100)",
    },
  ],
  responses: {
    200: { description: "Recent activity retrieved successfully" },
    500: { description: "Internal Server Error" },
  },
};

export default async function (data: Handler) {
  const { query } = data;

  try {
    const where: Record<string, any> = {};

    if (query.tokenId) where.tokenId = query.tokenId;
    if (query.collectionId) where.collectionId = query.collectionId;
    if (query.type) where.type = query.type;

    const limit = Math.min(
      Math.max(parseInt(query.limit as string, 10) || 20, 1),
      100
    );

    const activities = await models.nftActivity.findAll({
      where,
      include: [
        {
          model: models.nftToken,
          as: "token",
          attributes: ["id", "name", "image"],
          required: false,
        },
        {
          model: models.nftCollection,
          as: "collection",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: models.user,
          as: "fromUser",
          attributes: ["id", "firstName", "lastName", "avatar"],
          required: false,
        },
        {
          model: models.user,
          as: "toUser",
          attributes: ["id", "firstName", "lastName", "avatar"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
    });

    return activities;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to fetch recent activity",
    });
  }
}
