import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata = {
  summary: "Get NFT listings",
  description: "Returns a paginated list of NFT marketplace listings with filtering and sorting",
  operationId: "getNftListings",
  tags: ["NFT", "Listings"],
  requiresAuth: false,
  parameters: [
    { name: "type", in: "query", schema: { type: "string" }, description: "FIXED_PRICE, AUCTION, or BUNDLE" },
    { name: "status", in: "query", schema: { type: "string" }, description: "ACTIVE, SOLD, CANCELLED, EXPIRED" },
    { name: "sellerId", in: "query", schema: { type: "string" } },
    { name: "collectionId", in: "query", schema: { type: "string" } },
    { name: "priceMin", in: "query", schema: { type: "number" } },
    { name: "priceMax", in: "query", schema: { type: "number" } },
    { name: "currency", in: "query", schema: { type: "string" } },
    { name: "endingSoon", in: "query", schema: { type: "string" } },
    { name: "sortBy", in: "query", schema: { type: "string" } },
    { name: "page", in: "query", schema: { type: "number" } },
    { name: "limit", in: "query", schema: { type: "number" } },
  ],
  responses: {
    200: { description: "Listings retrieved successfully" },
    500: { description: "Internal Server Error" },
  },
};

export default async (data: Handler) => {
  const { query } = data;

  try {
    const where: any = {};

    // Default to ACTIVE listings
    where.status = query.status || "ACTIVE";
    if (query.type) where.type = query.type;
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.currency) where.currency = query.currency;

    // Price filtering
    if (query.priceMin || query.priceMax) {
      where.price = {};
      if (query.priceMin) where.price[Op.gte] = Number(query.priceMin);
      if (query.priceMax) where.price[Op.lte] = Number(query.priceMax);
    }

    // Ending soon: auctions ending within next 24 hours
    if (query.endingSoon === "true") {
      where.type = "AUCTION";
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      where.endTime = { [Op.gte]: now, [Op.lte]: in24h };
    }

    const pageNum = Math.max(1, parseInt(query.page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Sort mapping
    const sortMap: Record<string, [string, string]> = {
      price: ["price", "ASC"],
      endTime: ["endTime", "ASC"],
      views: ["views", "DESC"],
      createdAt: ["createdAt", "DESC"],
    };
    const [sortField, sortDir] = sortMap[query.sortBy as string] || ["createdAt", "DESC"];

    // Build includes
    const include: any[] = [
      {
        model: models.nftToken,
        as: "token",
        required: false,
        include: [
          {
            model: models.nftCollection,
            as: "collection",
            required: false,
            attributes: ["id", "name", "slug", "chain", "logoImage"],
          },
        ],
      },
      {
        model: models.user,
        as: "seller",
        required: false,
        attributes: ["id", "firstName", "lastName", "avatar"],
      },
    ];

    // If filtering by collectionId, filter through the token
    if (query.collectionId) {
      include[0].where = { collectionId: query.collectionId };
    }

    const { count, rows } = await models.nftListing.findAndCountAll({
      where,
      include,
      order: [[sortField, sortDir]],
      limit: limitNum,
      offset,
    });

    // Return in {data: [...]} format for frontend compatibility
    return {
      data: rows,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalItems: count,
        perPage: limitNum,
      },
    };
  } catch (error: any) {
    console.error("Error fetching NFT listings:", error);
    throw createError({ statusCode: 500, message: error.message || "Failed to fetch listings" });
  }
};
