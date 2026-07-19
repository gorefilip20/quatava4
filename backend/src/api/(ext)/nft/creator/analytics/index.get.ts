import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op, fn, col, literal } from "sequelize";

export const metadata = {
  summary: "Get creator analytics",
  operationId: "getCreatorAnalytics",
  tags: ["NFT", "Creator"],
  requiresAuth: true,
  parameters: [
    {
      name: "period",
      in: "query",
      schema: {
        type: "string",
        default: "30d",
        enum: ["24h", "7d", "30d", "90d", "1y", "all"],
      },
    },
    {
      name: "granularity",
      in: "query",
      schema: {
        type: "string",
        default: "day",
        enum: ["day", "week", "month"],
      },
    },
  ],
  responses: {
    200: {
      description: "Creator analytics retrieved successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "object",
                properties: {
                  totalSales: { type: "number" },
                  totalVolume: { type: "number" },
                  totalRoyalties: { type: "number" },
                  avgSalePrice: { type: "number" },
                  uniqueBuyers: { type: "number" },
                },
              },
              timeSeries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    period: { type: "string" },
                    volume: { type: "number" },
                    count: { type: "number" },
                    avgPrice: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default async (data: Handler) => {
  const { user, query } = data;
  const period = query?.period || "30d";
  const granularity = query?.granularity || "day";

  // Find creator profile
  const creatorProfile = await models.nftCreator.findOne({
    where: { userId: user.id },
  });

  if (!creatorProfile) {
    throw createError({
      statusCode: 404,
      message: "Creator profile not found",
    });
  }

  // Calculate time range based on period
  const now = new Date();
  let periodStartDate: Date | null = null;
  switch (period) {
    case "24h":
      periodStartDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      periodStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      periodStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      periodStartDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case "all":
    default:
      periodStartDate = null;
  }

  const periodCondition = periodStartDate
    ? { createdAt: { [Op.gte]: periodStartDate } }
    : {};

  // Compute summary
  // Total sales
  const totalSales = await models.nftSale.count({
    where: {
      sellerId: user.id,
      ...periodCondition,
    },
  });

  // Total volume
  const volumeResult = await models.nftSale.findOne({
    attributes: [[fn("SUM", col("price")), "totalVolume"]],
    where: {
      sellerId: user.id,
      status: "COMPLETED",
      ...periodCondition,
    },
    raw: true,
  });

  const totalVolume = parseFloat(volumeResult?.totalVolume) || 0;

  // Total royalties
  let totalRoyalties = 0;
  if (models.nftRoyalty) {
    const royaltyResult = await models.nftRoyalty.findOne({
      attributes: [[fn("SUM", col("amount")), "totalRoyalties"]],
      where: {
        recipientId: user.id,
        ...periodCondition,
      },
      raw: true,
    });
    totalRoyalties = parseFloat(royaltyResult?.totalRoyalties) || 0;
  }

  // Average sale price
  const avgSalePrice = totalSales > 0 ? totalVolume / totalSales : 0;

  // Unique buyers
  const uniqueBuyersResult = await models.nftSale.findOne({
    attributes: [[fn("COUNT", fn("DISTINCT", col("buyerId"))), "uniqueBuyers"]],
    where: {
      sellerId: user.id,
      ...periodCondition,
    },
    raw: true,
  });

  const uniqueBuyers = parseInt(uniqueBuyersResult?.uniqueBuyers) || 0;

  // Compute time series - group sales by period with volume, count, avg price
  let dateFormat: string;
  switch (granularity) {
    case "week":
      dateFormat = "%Y-W%u";
      break;
    case "month":
      dateFormat = "%Y-%m";
      break;
    case "day":
    default:
      dateFormat = "%Y-%m-%d";
  }

  // Use raw query for grouping by date truncation
  const timeSeriesQuery = `
    SELECT
      DATE_FORMAT(createdAt, '${dateFormat}') as period,
      SUM(price) as volume,
      COUNT(*) as count,
      AVG(price) as avgPrice
    FROM nft_sale
    WHERE sellerId = :userId
      AND status = 'COMPLETED'
      ${periodStartDate ? "AND createdAt >= :periodStart" : ""}
    GROUP BY period
    ORDER BY period ASC
  `;

  const replacements: any = {
    userId: user.id,
  };

  if (periodStartDate) {
    replacements.periodStart = periodStartDate;
  }

  const timeSeriesResult = await models.sequelize.query(timeSeriesQuery, {
    replacements,
    type: models.sequelize.QueryTypes.SELECT,
  });

  // Format time series data
  const timeSeries = timeSeriesResult.map((item: any) => ({
    period: item.period,
    volume: parseFloat(item.volume) || 0,
    count: parseInt(item.count) || 0,
    avgPrice: parseFloat(item.avgPrice) || 0,
  }));

  return {
    summary: {
      totalSales,
      totalVolume,
      totalRoyalties,
      avgSalePrice,
      uniqueBuyers,
    },
    timeSeries,
  };
};
