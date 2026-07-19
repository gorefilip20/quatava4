import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata = {
  summary: "List NFT Collections",
  description: "Retrieve a paginated list of public NFT collections with optional filtering and sorting.",
  operationId: "listNftCollections",
  tags: ["NFT", "Collections"],
  parameters: [
    {
      name: "search",
      in: "query",
      schema: { type: "string" },
      description: "Search collections by name or description",
    },
    {
      name: "chain",
      in: "query",
      schema: { type: "string" },
      description: "Filter by blockchain (e.g., ethereum, solana, polygon)",
    },
    {
      name: "categoryId",
      in: "query",
      schema: { type: "string" },
      description: "Filter by category UUID",
    },
    {
      name: "creatorId",
      in: "query",
      schema: { type: "string" },
      description: "Filter by creator UUID",
    },
    {
      name: "status",
      in: "query",
      schema: { type: "string", enum: ["DRAFT", "PENDING", "ACTIVE", "PAUSED", "ARCHIVED"] },
      description: "Filter by collection status",
    },
    {
      name: "isVerified",
      in: "query",
      schema: { type: "boolean" },
      description: "Filter by verified status",
    },
    {
      name: "sortField",
      in: "query",
      schema: { type: "string", enum: ["createdAt", "name", "totalSupply"] },
      description: "Field to sort by",
    },
    {
      name: "sortOrder",
      in: "query",
      schema: { type: "string", enum: ["ASC", "DESC"] },
      description: "Sort order (defaults to DESC)",
    },
    {
      name: "page",
      in: "query",
      schema: { type: "integer", minimum: 1 },
      description: "Page number",
    },
    {
      name: "limit",
      in: "query",
      schema: { type: "integer", minimum: 1, maximum: 100 },
      description: "Items per page (default: 50)",
    },
  ],
  responses: {
    200: {
      description: "Paginated list of NFT collections",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              collections: { type: "array", items: { type: "object" } },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  total: { type: "integer" },
                  totalPages: { type: "integer" },
                },
              },
            },
          },
        },
      },
    },
    400: { description: "Bad request" },
    500: { description: "Internal server error" },
  },
};

export default async function (data: Handler) {
  const { query } = data;

  try {
    const {
      search,
      chain,
      categoryId,
      creatorId,
      status,
      isVerified,
      sortField = "createdAt",
      sortOrder = "DESC",
      page = 1,
      limit = 50,
    } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Record<string, any> = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { symbol: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (chain) {
      where.chain = chain;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (status) {
      where.status = status;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === "true" || isVerified === true;
    }

    // Build order
    const allowedSortFields = ["createdAt", "name", "totalSupply"];
    const field = allowedSortFields.includes(sortField) ? sortField : "createdAt";
    const order = sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const orderClause: [string, string][] = [[field, order]];

    // Fetch collections
    const { count, rows: collections } = await models.nftCollection.findAndCountAll({
      where,
      include: [
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
          model: models.nftCategory,
          as: "category",
        },
      ],
      order: orderClause,
      limit: limitNum,
      offset,
    });

    return {
      collections,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    };
  } catch (error) {
    if (error?.name === "SequelizeValidationError") {
      throw createError({
        statusCode: 400,
        message: "Validation error",
        details: error.errors?.map((e: any) => e.message),
      });
    }
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : "Failed to fetch collections",
    });
  }
};
