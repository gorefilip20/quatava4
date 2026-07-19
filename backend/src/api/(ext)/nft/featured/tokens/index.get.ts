import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata = {
  summary: "Get featured tokens",
  description:
    "Retrieves featured NFT tokens for the homepage, ordered by popularity (views).",
  operationId: "getFeaturedTokens",
  tags: ["NFT", "Featured"],
  parameters: [
    {
      name: "limit",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 50 },
      description: "Number of results (default 12)",
    },
    {
      name: "category",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Filter by category slug or ID",
    },
  ],
  responses: {
    200: { description: "Featured tokens retrieved successfully" },
    500: { description: "Internal Server Error" },
  },
};

export default async function (data: Handler) {
  const { query } = data;

  try {
    const limit = Math.min(Math.max(parseInt(query.limit as string, 10) || 12, 1), 50);

    const where: Record<string, any> = {
      isListed: true,
      status: "MINTED",
    };

    const collectionWhere: Record<string, any> = {};

    // If category is provided, filter through collections
    if (query.category) {
      // Try to match category by slug or id
      const category = await models.nftCategory.findOne({
        where: {
          [Op.or]: [{ slug: query.category }, { id: query.category }],
        },
      });
      if (category) {
        collectionWhere.categoryId = category.id;
      } else {
        // No matching category found, return empty
        return [];
      }
    }

    const include: any[] = [
      {
        model: models.nftCollection,
        as: "collection",
        attributes: [
          "id",
          "name",
          "slug",
          "chain",
          "network",
          "standard",
          "isVerified",
          "logoImage",
          "status",
        ],
        required: true,
        where: Object.keys(collectionWhere).length > 0 ? collectionWhere : undefined,
      },
      {
        model: models.nftCreator,
        as: "creator",
        attributes: ["id", "displayName", "isVerified", "verificationTier"],
        required: false,
        include: [
          {
            model: models.user,
            as: "user",
            attributes: ["id", "firstName", "lastName", "avatar"],
          },
        ],
      },
      {
        model: models.nftListing,
        as: "currentListing",
        required: false,
        where: { status: "ACTIVE" },
        attributes: ["id", "type", "price", "currency", "endTime", "status"],
      },
    ];

    const tokens = await models.nftToken.findAll({
      where,
      include,
      order: [["views", "DESC"]],
      limit,
    });

    return tokens;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to fetch featured tokens",
    });
  }
}
