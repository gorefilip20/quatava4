import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata = {
  summary: "Get NFT Tokens",
  description: "Retrieves NFT tokens with filtering and pagination for the marketplace.",
  operationId: "getNftTokens",
  tags: ["NFT", "Tokens"],
  parameters: [
    { index: 0, name: "search", in: "query", required: false, schema: { type: "string" }, description: "Search by token name" },
    { index: 1, name: "categoryId", in: "query", required: false, schema: { type: "string" }, description: "Filter by category ID" },
    { index: 2, name: "collectionId", in: "query", required: false, schema: { type: "string" }, description: "Filter by collection ID" },
    { index: 3, name: "creatorId", in: "query", required: false, schema: { type: "string" }, description: "Filter by creator ID" },
    { index: 4, name: "ownerId", in: "query", required: false, schema: { type: "string" }, description: "Filter by owner ID" },
    { index: 5, name: "status", in: "query", required: false, schema: { type: "string" }, description: "Filter by status (DRAFT, MINTED, BURNED)" },
    { index: 6, name: "rarity", in: "query", required: false, schema: { type: "string" }, description: "Filter by rarity" },
    { index: 7, name: "isMinted", in: "query", required: false, schema: { type: "boolean" }, description: "Filter by minted status" },
    { index: 8, name: "isListed", in: "query", required: false, schema: { type: "boolean" }, description: "Filter by listed status" },
    { index: 9, name: "sortBy", in: "query", required: false, schema: { type: "string" }, description: "Sort field (createdAt, name, views, likes, rarity)" },
    { index: 10, name: "page", in: "query", required: false, schema: { type: "number" }, description: "Page number" },
    { index: 11, name: "limit", in: "query", required: false, schema: { type: "number" }, description: "Items per page" },
  ],
  responses: {
    200: { description: "Tokens retrieved successfully" },
    500: { description: "Internal Server Error" },
  },
};

export default async (data: Handler) => {
  const { query } = data;
  
  try {
    const where: any = {};
    
    if (query.search) {
      where.name = { [Op.like]: `%${query.search}%` };
    }
    if (query.collectionId) where.collectionId = query.collectionId;
    if (query.creatorId) where.creatorId = query.creatorId;
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.status) where.status = query.status;
    if (query.rarity) where.rarity = query.rarity;
    if (query.isMinted !== undefined) where.isMinted = query.isMinted === "true" || query.isMinted === true;
    if (query.isListed !== undefined) where.isListed = query.isListed === "true" || query.isListed === true;
    
    // Category filter via collection
    if (query.categoryId) {
      const collections = await models.nftCollection.findAll({
        where: { categoryId: query.categoryId },
        attributes: ["id"],
        raw: true,
      });
      where.collectionId = { [Op.in]: collections.map((c: any) => c.id) };
    }
    
    const page = parseInt(query.page as string, 10) || 1;
    const perPage = Math.min(parseInt(query.limit as string, 10) || 20, 100);
    const offset = (page - 1) * perPage;
    
    // Sort configuration
    let order: any = [["createdAt", "DESC"]];
    if (query.sortBy) {
      const sortMap: Record<string, any> = {
        createdAt: ["createdAt", "DESC"],
        name: ["name", "ASC"],
        views: ["views", "DESC"],
        likes: ["likes", "DESC"],
        rarity: ["rarityScore", "DESC"],
      };
      order = [sortMap[query.sortBy] || ["createdAt", "DESC"]];
    }
    
    const include = [
      {
        model: models.nftCollection,
        as: "collection",
        attributes: ["id", "name", "slug", "chain", "network", "standard", "isVerified", "logoImage", "status"],
        required: false,
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
        model: models.user,
        as: "owner",
        attributes: ["id", "firstName", "lastName", "avatar"],
        required: false,
      },
    ];
    
    // currentListing is already scoped to ACTIVE via model association
    const listingInclude = {
      model: models.nftListing,
      as: "currentListing",
      required: false,
      attributes: ["id", "type", "price", "currency", "startingBid", "endTime", "status", "createdAt"],
    };
    
    if (query.page || query.limit) {
      const { count, rows } = await models.nftToken.findAndCountAll({
        where,
        include: [...include, listingInclude],
        order,
        offset,
        limit: perPage,
      });
      
      return {
        items: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / perPage),
          totalItems: count,
          perPage,
        },
      };
    } else {
      const tokens = await models.nftToken.findAll({
        where,
        include: [...include, listingInclude],
        order,
        limit: 50,
      });
      return { items: tokens, pagination: null };
    }
  } catch (error: any) {
    console.error("Error fetching NFT tokens:", error);
    throw createError({ statusCode: 500, message: error.message || "Failed to fetch NFT tokens" });
  }
};