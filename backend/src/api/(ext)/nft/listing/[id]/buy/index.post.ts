import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata = {
  summary: "Buy NFT token",
  description: "Purchase an NFT token at fixed price from the marketplace",
  operationId: "buyNftToken",
  tags: ["NFT", "Listings", "Buy"],
  requiresAuth: true,
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  responses: {
    200: { description: "Purchase successful" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Cannot buy your own token" },
    404: { description: "Listing not found" },
  },
};

export default async (data: Handler) => {
  const userId = data.user?.id;
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const { id } = data.params;

  // Find listing
  const listing = await models.nftListing.findByPk(id, {
    include: [{ model: models.nftToken, as: "token" }],
  });
  if (!listing) throw createError({ statusCode: 404, message: "Listing not found" });

  // Validate listing is ACTIVE
  if (listing.status !== "ACTIVE") {
    throw createError({ statusCode: 400, message: "Listing is not active" });
  }

  // Validate listing type is FIXED_PRICE
  if (listing.type !== "FIXED_PRICE") {
    throw createError({ statusCode: 400, message: "This listing is not a fixed price listing" });
  }

  // Validate user is not the seller
  if (listing.sellerId === userId) {
    throw createError({ statusCode: 403, message: "You cannot buy your own token" });
  }

  // Get token
  const token = listing.token as any;
  if (!token) throw createError({ statusCode: 404, message: "Token not found" });

  // Calculate fees
  const price = Number(listing.price);
  const marketplaceFee = price * 0.025; // 2.5% marketplace fee
  const netAmount = price - marketplaceFee;

  // Create nftSale record
  const sale = await models.nftSale.create({
    tokenId: listing.tokenId,
    listingId: listing.id,
    sellerId: listing.sellerId,
    buyerId: userId,
    price: price,
    currency: listing.currency,
    marketplaceFee,
    royaltyFee: 0,
    totalFee: marketplaceFee,
    netAmount,
    status: "COMPLETED",
  });

  // Transfer token ownership
  await token.update({
    ownerId: userId,
    isListed: false,
  });

  // Update listing status to SOLD
  await listing.update({
    status: "SOLD",
    soldAt: new Date(),
  });

  // Create nftActivity for SALE
  await models.nftActivity.create({
    tokenId: listing.tokenId,
    collectionId: token.collectionId,
    listingId: listing.id,
    type: "SALE",
    fromUserId: listing.sellerId,
    toUserId: userId,
    price,
    currency: listing.currency,
    metadata: JSON.stringify({
      tokenName: token.name,
      salePrice: price,
      saleType: "fixed_price",
    }),
  });

  // Create nftActivity for TRANSFER
  await models.nftActivity.create({
    tokenId: listing.tokenId,
    collectionId: token.collectionId,
    listingId: listing.id,
    type: "TRANSFER",
    fromUserId: listing.sellerId,
    toUserId: userId,
    price,
    currency: listing.currency,
    metadata: JSON.stringify({
      tokenName: token.name,
      transferType: "sale",
    }),
  });

  // Create nftPriceHistory record
  await models.nftPriceHistory.create({
    tokenId: listing.tokenId,
    collectionId: token.collectionId,
    price,
    currency: listing.currency,
    saleType: "DIRECT",
    buyerId: userId,
    sellerId: listing.sellerId,
  });

  return {
    success: true,
    message: "Purchase successful",
    sale,
  };
};
