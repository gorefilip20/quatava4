import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata = {
  summary: "Cancel NFT listing",
  description: "Cancel an active NFT listing and remove it from the marketplace",
  operationId: "cancelNftListing",
  tags: ["NFT", "Listings"],
  requiresAuth: true,
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  responses: {
    200: { description: "Listing cancelled successfully" },
    401: { description: "Unauthorized" },
    403: { description: "Not the seller" },
    404: { description: "Listing not found" },
  },
};

export default async (data: Handler) => {
  const userId = data.user?.id;
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const { id } = data.params;

  // Find listing
  const listing = await models.nftListing.findByPk(id);
  if (!listing) throw createError({ statusCode: 404, message: "Listing not found" });

  // Validate user is the seller
  if (listing.sellerId !== userId) {
    throw createError({ statusCode: 403, message: "You are not the seller of this listing" });
  }

  // Validate listing is active
  if (listing.status !== "ACTIVE") {
    throw createError({ statusCode: 400, message: "Listing is not active" });
  }

  // Update listing status to CANCELLED
  await listing.update({
    status: "CANCELLED",
    cancelledAt: new Date(),
  });

  // Update token isListed
  const token = await models.nftToken.findByPk(listing.tokenId);
  if (token) {
    await token.update({ isListed: false });
  }

  // Create nftActivity
  await models.nftActivity.create({
    tokenId: listing.tokenId,
    listingId: listing.id,
    type: "DELIST",
    fromUserId: userId,
    price: listing.price,
    currency: listing.currency,
    metadata: JSON.stringify({
      tokenName: token?.name || "Unknown",
      listingId: listing.id,
    }),
  });

  return { success: true, message: "Listing cancelled successfully" };
};
