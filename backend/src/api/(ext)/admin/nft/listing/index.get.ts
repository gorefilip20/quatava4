import { models } from "@b/db";
import {
  getFiltered,
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import { crudParameters } from "@b/utils/constants";

export const metadata: any = {
  summary: "List all NFT listings",
  operationId: "listNftListings",
  tags: ["Admin", "NFT", "Listing"],
  permission: "view.nft.listing",
  requiresAuth: true,
  parameters: crudParameters,
  responses: {
    200: { description: "List of NFT listings" },
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
    model: models.nftListing,
    query,
    sortField: query.sortField || "createdAt",
    includeModels: [
      {
        model: models.nftToken,
        as: "token",
        required: false,
        attributes: ["id", "name", "tokenId", "image", "collectionId"],
      },
      {
        model: models.user,
        as: "seller",
        required: false,
        attributes: ["id", "firstName", "lastName", "email", "avatar"],
      },
    ],
  });
};
