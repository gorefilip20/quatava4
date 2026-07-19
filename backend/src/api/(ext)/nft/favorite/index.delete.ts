import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata = {
  summary: "Remove from favorites",
  description: "Remove an NFT token or collection from the user's favorites list.",
  operationId: "removeFavorite",
  tags: ["NFT", "Favorites"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            tokenId: { type: "string", description: "Token ID to unfavorite" },
            collectionId: {
              type: "string",
              description: "Collection ID to unfavorite",
            },
          },
        },
      },
    },
  },
  responses: {
    200: { description: "Favorite removed successfully" },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
    404: { description: "Favorite not found" },
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

  // Find the favorite for this user + token/collection
  const favorite = await models.nftFavorite.findOne({
    where: {
      userId,
      ...(tokenId ? { tokenId } : { collectionId }),
    },
  });

  if (!favorite) {
    throw createError({
      statusCode: 404,
      message: "Favorite not found",
    });
  }

  // Delete the favorite (paranoid soft delete)
  await favorite.destroy();

  // Decrement likes count on the token or collection
  if (tokenId) {
    const token = await models.nftToken.findByPk(tokenId);
    if (token && (token.likes ?? 0) > 0) {
      await models.nftToken.decrement("likes", {
        where: { id: tokenId },
      });
    }
  }

  return { success: true, message: "Favorite removed successfully" };
}
