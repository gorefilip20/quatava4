import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata = {
  summary: "Get creator profile",
  operationId: "getCreatorProfile",
  tags: ["NFT", "Creator"],
  requiresAuth: true,
  responses: {
    200: {
      description: "Creator profile retrieved successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              id: { type: "string" },
              userId: { type: "string" },
              displayName: { type: "string" },
              bio: { type: "string" },
              banner: { type: "string" },
              profilePublic: { type: "boolean" },
              followerCount: { type: "number" },
              followingCount: { type: "number" },
              user: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  avatar: { type: "string" },
                  email: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default async (data: Handler) => {
  const { user } = data;

  // Find or create creator profile
  let creatorProfile = await models.nftCreator.findOne({
    where: { userId: user.id },
    include: [
      {
        model: models.user,
        as: "user",
        attributes: ["firstName", "lastName", "avatar", "email"],
      },
    ],
  });

  if (!creatorProfile) {
    // Auto-create creator profile
    creatorProfile = await models.nftCreator.create({
      userId: user.id,
      displayName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      bio: "",
      profilePublic: true,
    });

    // Re-fetch with includes
    creatorProfile = await models.nftCreator.findOne({
      where: { userId: user.id },
      include: [
        {
          model: models.user,
          as: "user",
          attributes: ["firstName", "lastName", "avatar", "email"],
        },
      ],
    });
  }

  // Compute follower and following counts
  let followerCount = 0;
  let followingCount = 0;

  if (models.nftCreatorFollow) {
    followerCount = await models.nftCreatorFollow.count({
      where: { followingId: creatorProfile.userId },
    });

    followingCount = await models.nftCreatorFollow.count({
      where: { followerId: creatorProfile.userId },
    });
  }

  return {
    ...creatorProfile.toJSON(),
    followerCount,
    followingCount,
  };
};
