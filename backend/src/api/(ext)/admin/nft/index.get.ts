import { models } from "@b/db";
import {
  getFiltered,
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import { crudParameters } from "@b/utils/constants";

export const metadata: any = {
  summary: "List all NFT tokens",
  operationId: "listNftTokens",
  tags: ["Admin", "NFT"],
  permission: "view.nft.token",
  requiresAuth: true,
  parameters: crudParameters,
  responses: {
    200: {
      description: "List of NFT tokens",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: { type: "object" },
          },
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
    model: models.nftToken,
    query,
    sortField: query.sortField || "createdAt",
    includeModels: [
      {
        model: models.nftCollection,
        as: "collection",
        attributes: ["id", "name", "slug", "chain", "logoImage", "status"],
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
            attributes: ["id", "firstName", "lastName", "email", "avatar"],
          },
        ],
      },
      {
        model: models.user,
        as: "owner",
        attributes: ["id", "firstName", "lastName", "email", "avatar"],
        required: false,
      },
    ],
  });
};
