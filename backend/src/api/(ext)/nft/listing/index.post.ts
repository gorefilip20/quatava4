import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata = {
  summary: "Create NFT listing",
  description: "List an NFT token for sale on the marketplace",
  operationId: "createNftListing",
  tags: ["NFT", "Listings"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["tokenId", "type", "currency"],
          properties: {
            tokenId: { type: "string" },
            type: { type: "string", enum: ["FIXED_PRICE", "AUCTION", "BUNDLE"] },
            price: { type: "number" },
            currency: { type: "string" },
            startingBid: { type: "number" },
            reservePrice: { type: "number" },
            minBidIncrement: { type: "number" },
            buyNowPrice: { type: "number" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  responses: {
    201: { description: "Listing created successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    404: { description: "Token not found" },
  },
};

export default async (data: Handler) => {
  const userId = data.user?.id;
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const {
    tokenId,
    type,
    price,
    currency,
    startingBid,
    reservePrice,
    minBidIncrement,
    buyNowPrice,
    startTime,
    endTime,
  } = data.body;

  // Validate token exists
  const token = await models.nftToken.findByPk(tokenId);
  if (!token) throw createError({ statusCode: 404, message: "Token not found" });

  // Validate user is the owner
  if (token.ownerId !== userId) {
    throw createError({ statusCode: 403, message: "You are not the owner of this token" });
  }

  // Validate token is not already listed
  const existingListing = await models.nftListing.findOne({
    where: {
      tokenId,
      status: { [Op.in]: ["ACTIVE"] },
    },
  });
  if (existingListing) {
    throw createError({ statusCode: 400, message: "Token is already listed for sale" });
  }

  // Validate listing type
  if (!["FIXED_PRICE", "AUCTION", "BUNDLE"].includes(type)) {
    throw createError({ statusCode: 400, message: "Invalid listing type" });
  }

  // Validate price for fixed price listings
  if (type === "FIXED_PRICE" && (!price || price <= 0)) {
    throw createError({ statusCode: 400, message: "Price must be greater than 0 for fixed price listings" });
  }

  // Validate auction fields
  if (type === "AUCTION") {
    if (!startingBid || startingBid <= 0) {
      throw createError({ statusCode: 400, message: "Starting bid must be greater than 0 for auctions" });
    }
    if (!endTime) {
      throw createError({ statusCode: 400, message: "End time is required for auctions" });
    }
  }

  // Create listing
  const listing = await models.nftListing.create({
    tokenId,
    sellerId: userId,
    type,
    price: price || startingBid || 0,
    currency: currency || "ETH",
    startingBid: startingBid || undefined,
    reservePrice: reservePrice || undefined,
    minBidIncrement: minBidIncrement || undefined,
    buyNowPrice: buyNowPrice || undefined,
    startTime: startTime || new Date(),
    endTime: endTime || undefined,
    status: "ACTIVE",
    views: 0,
    likes: 0,
  });

  // Update token isListed
  await token.update({ isListed: true });

  // Create nftActivity
  await models.nftActivity.create({
    tokenId,
    collectionId: token.collectionId,
    listingId: listing.id,
    type: "LIST",
    fromUserId: userId,
    price: listing.price,
    currency: listing.currency,
    metadata: JSON.stringify({
      tokenName: token.name,
      listingType: type,
    }),
  });

  return listing;
};
