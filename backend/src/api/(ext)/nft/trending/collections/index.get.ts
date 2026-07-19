import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op, fn, col, literal } from "sequelize";

export const metadata = {
  summary: "Get trending collections",
  description:
    "Retrieves trending NFT collections based on recent activity volume within a given timeframe.",
  operationId: "getTrendingCollections",
  tags: ["NFT", "Trending"],
  parameters: [
    {
      name: "limit",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 50 },
      description: "Number of results (default 10)",
    },
    {
      name: "timeframe",
      in: "query",
      required: false,
      schema: { type: "string", enum: ["24h", "7d", "30d", "all"] },
      description: "Timeframe for trending calculation (default: 24h)",
    },
  ],
  responses: {
    200: { description: "Trending collections retrieved successfully" },
    500: { description: "Internal Server Error" },
  },
};

export default async function (data: Handler) {
  const { query } = data;

  try {
    const limit = Math.min(Math.max(parseInt(query.limit as string, 10) || 10, 1), 50);
    const timeframe = (query.timeframe as string) || "24h";

    // Compute the start date based on timeframe
    const now = new Date();
    let startDate: Date | null = null;

    switch (timeframe) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        startDate = null;
        break;
    }

    // Build activity where clause for timeframe filtering
    const activityWhere: Record<string, any> = {};
    if (startDate) {
      activityWhere.createdAt = { [Op.gte]: startDate };
    }

    // Get activity counts per collection for the timeframe
    const activityCounts = await models.nftActivity.findAll({
      attributes: [
        "collectionId",
        [fn("COUNT", col("id")), "activityCount"],
      ],
      where: {
        ...activityWhere,
        collectionId: { [Op.ne]: null },
      },
      group: ["collectionId"],
      order: [[literal("activityCount"), "DESC"]],
      limit: limit * 2, // Fetch more to ensure we have enough after filtering
      raw: true,
    });

    const collectionIds = activityCounts
      .map((a: any) => a.collectionId)
      .filter(Boolean);

    if (collectionIds.length === 0) {
      // Fallback: return ACTIVE collections ordered by totalSupply
      const collections = await models.nftCollection.findAll({
        where: { status: "ACTIVE" },
        include: [
          {
            model: models.nftCreator,
            as: "creator",
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
            model: models.nftCategory,
            as: "category",
            required: false,
          },
        ],
        order: [["totalSupply", "DESC"]],
        limit,
      });
      return collections;
    }

    // Fetch the full collection details with activity counts
    const collections = await models.nftCollection.findAll({
      where: {
        id: { [Op.in]: collectionIds },
        status: "ACTIVE",
      },
      include: [
        {
          model: models.nftCreator,
          as: "creator",
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
          model: models.nftCategory,
          as: "category",
          required: false,
        },
      ],
    });

    // Merge activity counts and sort by activity
    const activityCountMap: Record<string, number> = {};
    activityCounts.forEach((a: any) => {
      activityCountMap[a.collectionId] = parseInt(a.activityCount, 10);
    });

    const sortedCollections = collections
      .map((c: any) => ({
        ...c.toJSON(),
        activityCount: activityCountMap[c.id] || 0,
      }))
      .sort((a: any, b: any) => b.activityCount - a.activityCount)
      .slice(0, limit);

    return sortedCollections;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to fetch trending collections",
    });
  }
}
