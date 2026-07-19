import { models } from "@b/db";
import {
  getFiltered,
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import { crudParameters } from "@b/utils/constants";

export const metadata: any = {
  summary: "List all NFT sales",
  operationId: "listNftSales",
  tags: ["Admin", "NFT", "Sale"],
  permission: "view.nft.sale",
  requiresAuth: true,
  parameters: crudParameters,
  responses: {
    200: { description: "List of NFT sales" },
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
    model: models.nftSale,
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
        model: models.nftListing,
        as: "listing",
        required: false,
      },
      {
        model: models.user,
        as: "seller",
        required: false,
        attributes: ["id", "firstName", "lastName", "email", "avatar"],
      },
      {
        model: models.user,
        as: "buyer",
        required: false,
        attributes: ["id", "firstName", "lastName", "email", "avatar"],
      },
    ],
  });
};
