import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op, fn, col, literal } from "sequelize";

export const metadata = {
  summary: "Get creator dashboard data",
  operationId: "getCreatorDashboard",
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
  ],
  responses: {
    200: {
      description: "Creator dashboard data retrieved successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              overview: {
                type: "object",
                properties: {
                  totalCollections: { type: "number" },
                  totalTokens: { type: "number" },
                  totalSales: { type: "number" },
                  totalVolume: { type: "number" },
                  totalRoyalties: { type: "number" },
                  averageSalePrice: { type: "number" },
                  activeListingsCount: { type: "number" },
                  receivedOffersCount: { type: "number" },
                },
              },
              collections: { type: "array" },
              tokens: { type: "array" },
              sales: { type: "array" },
              activities: { type: "array" },
            },
          },
        },
      },
    },
  },
};

export default async (data: Handler) => {
  const { user, query } = data;
  if (!user) throw createError(401, "Unauthorized access");
  const period = query?.period || "30d";

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

  // Compute overview metrics
  const totalCollections = await models.nftCollection.count({
    where: { creatorId: creatorProfile.id },
  });

  const totalTokens = await models.nftToken.count({
    where: { creatorId: creatorProfile.id },
  });

  const totalSales = await models.nftSale.count({
    where: {
      sellerId: user.id,
      ...periodCondition,
    },
  });

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

  // Calculate royalties
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

  const averageSalePrice = totalSales > 0 ? totalVolume / totalSales : 0;

  // Active listings count
  let activeListingsCount = 0;
  if (models.nftListing) {
    activeListingsCount = await models.nftListing.count({
      where: {
        sellerId: user.id,
        status: "ACTIVE",
      },
    });
  }

  // Received offers count (on user's tokens)
  let receivedOffersCount = 0;
  if (models.nftOffer && models.nftToken) {
    const userTokenIds = await models.nftToken.findAll({
      attributes: ["id"],
      where: { creatorId: creatorProfile.id },
      raw: true,
    });
    const tokenIds = userTokenIds.map((t) => t.id);

    if (tokenIds.length > 0) {
      receivedOffersCount = await models.nftOffer.count({
        where: {
          tokenId: { [Op.in]: tokenIds },
          status: "ACTIVE",
        },
      });
    }
  }

  // Include collections (recent 5)
  const collections = await models.nftCollection.findAll({
    where: { creatorId: creatorProfile.id },
    order: [["createdAt", "DESC"]],
    limit: 5,
  });

  // Include tokens (recent 10)
  const tokens = await models.nftToken.findAll({
    where: { creatorId: creatorProfile.id },
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  // Include sales (recent 10)
  const sales = await models.nftSale.findAll({
    where: { sellerId: user.id },
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  // Include activities (recent 20) - using nftActivity if exists
  let activities: any[] = [];
  if (models.nftActivity) {
    activities = await models.nftActivity.findAll({
      where: {
        [Op.or]: [
          { fromUserId: user.id },
          { toUserId: user.id },
        ],
      },
      order: [["createdAt", "DESC"]],
      limit: 20,
    });
  }

  return {
    overview: {
      totalCollections,
      totalTokens,
      totalSales,
      totalVolume,
      totalRoyalties,
      averageSalePrice,
      activeListingsCount,
      receivedOffersCount,
    },
    collections,
    tokens,
    sales,
    activities,
  };
};
