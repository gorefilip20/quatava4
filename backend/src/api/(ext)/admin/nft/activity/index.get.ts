import { models } from "@b/db";
import {
  getFiltered,
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import { crudParameters } from "@b/utils/constants";

export const metadata: any = {
  summary: "List all NFT activities",
  operationId: "listNftActivities",
  tags: ["Admin", "NFT", "Activity"],
  permission: "view.nft.activity",
  requiresAuth: true,
  parameters: crudParameters,
  responses: {
    200: {
      description: "List of NFT activities",
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
    model: models.nftActivity,
    query,
    sortField: query.sortField || "createdAt",
    includeModels: [
      {
        model: models.nftToken,
        as: "token",
        required: false,
        attributes: ["id", "name", "tokenId", "image"],
      },
      {
        model: models.nftCollection,
        as: "collection",
        required: false,
        attributes: ["id", "name", "slug"],
      },
      {
        model: models.nftListing,
        as: "listing",
        required: false,
      },
      {
        model: models.user,
        as: "fromUser",
        required: false,
        attributes: ["id", "firstName", "lastName", "email", "avatar"],
      },
      {
        model: models.user,
        as: "toUser",
        required: false,
        attributes: ["id", "firstName", "lastName", "email", "avatar"],
      },
    ],
  });
};
