import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata = {
  summary: "Update NFT Token",
  description: "Updates NFT token metadata. Only the creator or owner can update.",
  operationId: "updateNftToken",
  tags: ["NFT", "Tokens"],
  requiresAuth: true,
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Token ID" },
  ],
  requestBody: {
    description: "Token update data",
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            image: { type: "string" },
            attributes: { type: "array", items: { type: "object" } },
            metadataUri: { type: "string" },
          },
        },
      },
    },
  },
  responses: {
    200: { description: "Token updated successfully" },
    401: { description: "Unauthorized" },
    404: { description: "Token not found" },
    500: { description: "Internal Server Error" },
  },
};

export default async (data: Handler) => {
  const { user, params, body } = data;
  
  if (!user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  
  try {
    const token = await models.nftToken.findByPk(params.id, {
      include: [{ model: models.nftCreator, as: "creator", attributes: ["userId"] }],
    });
    
    if (!token) {
      throw createError({ statusCode: 404, message: "Token not found" });
    }
    
    // Check authorization
    const isCreator = token.creator?.userId === user.id;
    const isOwner = token.ownerId === user.id;
    if (!isCreator && !isOwner) {
      throw createError({ statusCode: 403, message: "Not authorized to update this token" });
    }
    
    // Only allow updating draft tokens
    if (token.status === "BURNED") {
      throw createError({ statusCode: 400, message: "Cannot update a burned token" });
    }
    
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.attributes !== undefined) updateData.attributes = body.attributes;
    if (body.metadataUri !== undefined) updateData.metadataUri = body.metadataUri;
    
    await token.update(updateData);
    
    return token;
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error updating NFT token:", error);
    throw createError({ statusCode: 500, message: error.message || "Failed to update NFT token" });
  }
};