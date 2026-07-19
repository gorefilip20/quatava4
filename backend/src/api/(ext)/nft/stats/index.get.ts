import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op, fn, col } from "sequelize";

export const metadata = {
  summary: "Get marketplace stats",
  description:
    "Retrieves aggregate NFT marketplace statistics including collections, tokens, sales, and volume.",
  operationId: "getMarketplaceStats",
  tags: ["NFT", "Stats"],
  parameters: [
    {
      name: "timeframe",
      in: "query",
      required: false,
      schema: { type: "string", enum: ["24h", "7d", "30d", "all"] },
      description: "Timeframe for stats (default: 24h)",
    },
  ],
  responses: {
    200: { description: "Marketplace stats retrieved successfully" },
    500: { description: "Internal Server Error" },
  },
};

export default async function (data: Handler) {
  const { query } = data;

  try {
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

    // Total active collections
    const totalCollections = await models.nftCollection.count({
      where: { status: "ACTIVE" },
    });

    // Total minted tokens
    const totalTokens = await models.nftToken.count({
      where: { status: "MINTED" },
    });

    // Total active listings
    const totalListings = await models.nftListing.count({
      where: { status: "ACTIVE" },
    });

    // Total sales in timeframe
    const saleWhere: Record<string, any> = {
      status: "COMPLETED",
    };
    if (startDate) {
      saleWhere.createdAt = { [Op.gte]: startDate };
    }

    const totalSales = await models.nftSale.count({
      where: saleWhere,
    });

    // Total volume in timeframe
    const volumeResult = await models.nftSale.findOne({
      attributes: [
        [fn("COALESCE", fn("SUM", col("price")), 0), "totalVolume"],
        [fn("COALESCE", fn("AVG", col("price")), 0), "averagePrice"],
      ],
      where: saleWhere,
      raw: true,
    });

    const totalVolume = parseFloat((volumeResult as any)?.totalVolume || "0");
    const averagePrice = parseFloat((volumeResult as any)?.averagePrice || "0");

    return {
      totalCollections,
      totalTokens,
      totalListings,
      totalSales,
      totalVolume,
      averagePrice,
      activeListings: totalListings,
      timeframe,
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to fetch marketplace stats",
    });
  }
}
