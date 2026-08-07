import { models } from "@b/db";
import {
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import { crudParameters, paginationSchema } from "@b/utils/constants";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata: OperationObject = {
  summary: "List conversion history",
  description:
    "Returns paginated list of the authenticated user's currency conversions.",
  operationId: "getConversionHistory",
  tags: ["Finance", "Convert"],
  requiresAuth: true,
  parameters: [
    ...crudParameters,
    {
      name: "fromCurrency",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Filter by source currency",
    },
    {
      name: "toCurrency",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Filter by target currency",
    },
  ],
  responses: {
    200: {
      description: "Conversion history retrieved successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    fromCurrency: { type: "string" },
                    toCurrency: { type: "string" },
                    fromType: { type: "string" },
                    toType: { type: "string" },
                    fromAmount: { type: "number" },
                    toAmount: { type: "number" },
                    rate: { type: "number" },
                    fee: { type: "number" },
                    status: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              pagination: paginationSchema,
            },
          },
        },
      },
    },
    401: unauthorizedResponse,
    404: notFoundMetadataResponse("Conversions"),
    500: serverErrorResponse,
  },
};

export default async (data: Handler) => {
  const { user, query } = data;

  if (!user?.id)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const {
    fromCurrency,
    toCurrency,
    page = 1,
    perPage = 10,
    sortOrder = "DESC",
  } = query;

  const limit = Math.min(parseInt(perPage) || 10, 100);
  const offset = ((parseInt(page) || 1) - 1) * limit;

  const where: any = {
    userId: user.id,
    type: "OUTGOING_TRANSFER",
    metadata: { [Op.like]: '%"action":"CONVERT"%' },
  };

  const { count, rows } = await models.transaction.findAndCountAll({
    where,
    order: [["createdAt", sortOrder === "ASC" ? "ASC" : "DESC"]],
    limit,
    offset,
    include: [
      {
        model: models.wallet,
        as: "wallet",
        attributes: ["currency", "type"],
      },
    ],
  });

  const conversions = rows.map((tx: any) => {
    let meta: any = {};
    try {
      meta = typeof tx.metadata === "string" ? JSON.parse(tx.metadata) : tx.metadata || {};
    } catch {
      meta = {};
    }

    const matchesFrom = !fromCurrency || meta.fromCurrency === fromCurrency;
    const matchesTo = !toCurrency || meta.toCurrency === toCurrency;
    if (!matchesFrom || !matchesTo) return null;

    return {
      id: tx.id,
      fromCurrency: meta.fromCurrency || tx.wallet?.currency,
      toCurrency: meta.toCurrency,
      fromType: meta.fromType || tx.wallet?.type,
      toType: meta.toType,
      fromAmount: tx.amount,
      toAmount: meta.convertedAmount,
      rate: meta.rate,
      fee: tx.fee,
      status: tx.status,
      createdAt: tx.createdAt,
    };
  }).filter(Boolean);

  const totalPages = Math.ceil(count / limit);

  return {
    data: conversions,
    pagination: {
      totalItems: count,
      currentPage: parseInt(page) || 1,
      perPage: limit,
      totalPages,
    },
  };
};
