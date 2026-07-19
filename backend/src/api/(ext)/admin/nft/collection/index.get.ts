import { models } from "@b/db";
import {
  getFiltered,
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import { crudParameters } from "@b/utils/constants";

export const metadata: any = {
  summary: "List all NFT collections",
  operationId: "listNftCollections",
  tags: ["Admin", "NFT", "Collection"],
  permission: "view.nft.collection",
  requiresAuth: true,
  parameters: crudParameters,
  responses: {
    200: {
      description: "List of NFT collections",
      content: {
        "application/json": {
          schema: { type: "array", items: { type: "object" } },
        },
      },
    },
    401: unauthorizedResponse,
    403: { description: "Forbidden" },
    500: serverErrorResponse,
  },
};

export default async (data: Handler) => {
  const { user, query } = data;

  if (!user) {
    throw new Error("Unauthorized");
  }

  return getFiltered({
    model: models.nftCollection,
    query,
    sortField: query.sortField || "createdAt",
    includeModels: [
      {
        model: models.nftCreator,
        as: "creator",
        required: false,
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
        required: false,
        attributes: ["id", "name", "slug"],
      },
    ],
  });
};
