import { models } from "@b/db";
import {
  getFiltered,
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import { crudParameters } from "@b/utils/constants";

export const metadata: any = {
  summary: "List all marketplace deployments",
  operationId: "listNftMarketplaces",
  tags: ["Admin", "NFT", "Marketplace"],
  permission: "view.nft.marketplace",
  requiresAuth: true,
  parameters: crudParameters,
  responses: {
    200: { description: "List of marketplace deployments" },
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
    model: models.nftMarketplace,
    query,
    sortField: query.sortField || "createdAt",
    includeModels: [
      {
        model: models.user,
        as: "deployer",
        required: false,
        attributes: ["id", "firstName", "lastName", "email", "avatar"],
      },
      {
        model: models.user,
        as: "pauser",
        required: false,
        attributes: ["id", "firstName", "lastName", "email", "avatar"],
      },
    ],
  });
};
