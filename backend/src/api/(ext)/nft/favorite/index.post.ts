import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata = {
  summary: "Add to favorites",
  description: "Add an NFT token or collection to the user's favorites list.",
  operationId: "addFavorite",
  tags: ["NFT", "Favorites"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            tokenId: { type: "string", description: "Token ID to favorite" },
            collectionId: {
              type: "string",
              description: "Collection ID to favorite",
            },
          },
        },
      },
    },
  },
  responses: {
    200: { description: "Favorite added successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    404: { description: "Token or collection not found" },
  },
};

export default async function (data: Handler) {
  const userId = data.user?.id;
  if (!userId) throw createError({ statusCode: 401, message: "Unauthorized" });

  const { tokenId, collectionId } = data.body;

  // Validate: exactly one must be provided
  if (!tokenId && !collectionId) {
    throw createError({
      statusCode: 400,
      message: "Either tokenId or collectionId must be provided",
    });
  }
  if (tokenId && collectionId) {
    throw createError({
      statusCode: 400,
      message: "Provide either tokenId or collectionId, not both",
    });
  }

  // Validate the target exists
  if (tokenId) {
    const token = await models.nftToken.findByPk(tokenId);
    if (!token) {
      throw createError({ statusCode: 404, message: "Token not found" });
    }
  }

  if (collectionId) {
    const collection = await models.nftCollection.findByPk(collectionId);
    if (!collection) {
      throw createError({ statusCode: 404, message: "Collection not found" });
    }
  }

  // Check if already favorited
  const existingFavorite = await models.nftFavorite.findOne({
    where: {
      userId,
      ...(tokenId ? { tokenId } : { collectionId }),
    },
  });

  if (existingFavorite) {
    return existingFavorite;
  }

  // Create favorite record
  const favorite = await models.nftFavorite.create({
    userId,
    ...(tokenId ? { tokenId } : { collectionId }),
  });

  // Increment likes count on the token or collection
  if (tokenId) {
    await models.nftToken.increment("likes", {
      where: { id: tokenId },
    });
  }

  return favorite;
}
