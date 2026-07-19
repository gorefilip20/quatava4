import { models } from "@b/db";
import {
  getFiltered,
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import { crudParameters } from "@b/utils/constants";

export const metadata: any = {
  summary: "List all NFT offers",
  operationId: "listNftOffers",
  tags: ["Admin", "NFT", "Offer"],
  permission: "view.nft.offer",
  requiresAuth: true,
  parameters: crudParameters,
  responses: {
    200: { description: "List of NFT offers" },
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
    model: models.nftOffer,
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
        as: "user",
        required: false,
        attributes: ["id", "firstName", "lastName", "email", "avatar"],
      },
    ],
  });
};
