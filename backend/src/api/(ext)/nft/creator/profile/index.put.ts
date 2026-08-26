import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata = {
  summary: "Update creator profile",
  operationId: "updateCreatorProfile",
  tags: ["NFT", "Creator"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            displayName: { type: "string" },
            bio: { type: "string" },
            banner: { type: "string" },
            profilePublic: { type: "boolean" },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Creator profile updated successfully",
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
            },
          },
        },
      },
    },
  },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user) throw createError(401, "Unauthorized access");
  const { displayName, bio, banner, profilePublic } = body;

  // Find or create creator profile
  let [creatorProfile, created] = await models.nftCreator.findOrCreate({
    where: { userId: user.id },
    defaults: {
      userId: user.id,
      displayName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      bio: "",
      profilePublic: true,
    },
  });

  // Build update object with only provided fields
  const updateData: any = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (bio !== undefined) updateData.bio = bio;
  if (banner !== undefined) updateData.banner = banner;
  if (profilePublic !== undefined) updateData.profilePublic = profilePublic;

  // Only update if there are changes
  if (Object.keys(updateData).length > 0) {
    await models.nftCreator.update(updateData, {
      where: { userId: user.id },
    });

    // Refetch updated profile
    creatorProfile = await models.nftCreator.findOne({
      where: { userId: user.id },
    });
  }

  return creatorProfile;
};
