import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata = {
  summary: "Get top creators",
  description:
    "Retrieves top NFT creators ranked by total volume or total sales.",
  operationId: "getTopCreators",
  tags: ["NFT", "Creators"],
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
      description: "Timeframe filter (default: all)",
    },
    {
      name: "sortBy",
      in: "query",
      required: false,
      schema: { type: "string", enum: ["volume", "sales"] },
      description: "Sort by totalVolume or totalSales (default: volume)",
    },
  ],
  responses: {
    200: { description: "Top creators retrieved successfully" },
    500: { description: "Internal Server Error" },
  },
};

export default async function (data: Handler) {
  const { query } = data;

  try {
    const limit = Math.min(Math.max(parseInt(query.limit as string, 10) || 10, 1), 50);
    const sortBy = (query.sortBy as string) === "sales" ? "totalSales" : "totalVolume";

    // Build where clause: only include verified creators or those with non-zero stats
    const where: Record<string, any> = {
      [Op.or]: [
        { isVerified: true },
        { [sortBy]: { [Op.gt]: 0 } },
      ],
    };

    const creators = await models.nftCreator.findAll({
      where,
      include: [
        {
          model: models.user,
          as: "user",
          attributes: ["id", "firstName", "lastName", "avatar"],
        },
      ],
      order: [[sortBy, "DESC"]],
      limit,
    });

    return creators;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to fetch top creators",
    });
  }
}
