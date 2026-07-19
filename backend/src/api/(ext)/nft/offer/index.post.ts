import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata = {
  summary: "Make offer on NFT token",
  description: "Place an offer to purchase an NFT token",
  operationId: "makeNftOffer",
  tags: ["NFT", "Offers"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["tokenId", "amount", "currency"],
          properties: {
            tokenId: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" },
            expiresAt: { type: "string", format: "date-time" },
            message: { type: "string" },
          },
        },
      },
    },
  },
  responses: {
    201: { description: "Offer created successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Cannot offer on your own token" },
    404: { description: "Token not found" },
  },
};

export default async (data: Handler) => {
  const userId = data.user?.id;
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const { tokenId, amount, currency, expiresAt, message } = data.body;

  // Validate token exists
  const token = await models.nftToken.findByPk(tokenId);
  if (!token) throw createError({ statusCode: 404, message: "Token not found" });

  // Validate user is not the token owner
  if (token.ownerId === userId) {
    throw createError({ statusCode: 403, message: "You cannot make an offer on your own token" });
  }

  // Validate amount
  if (!amount || amount <= 0) {
    throw createError({ statusCode: 400, message: "Amount must be greater than 0" });
  }

  // Create offer with status ACTIVE (nftOffer uses userId, not buyerId)
  const offer = await models.nftOffer.create({
    tokenId,
    userId,
    amount,
    currency: currency || "ETH",
    expiresAt: expiresAt || undefined,
    message: message || undefined,
    status: "ACTIVE",
    type: "TOKEN",
  });

  // Create nftActivity of type OFFER
  await models.nftActivity.create({
    tokenId,
    collectionId: token.collectionId,
    fromUserId: userId,
    toUserId: token.ownerId,
    offerId: offer.id,
    type: "OFFER",
    price: amount,
    currency: currency || "ETH",
    metadata: JSON.stringify({
      tokenName: token.name,
      offerAmount: amount,
    }),
  });

  return offer;
};
