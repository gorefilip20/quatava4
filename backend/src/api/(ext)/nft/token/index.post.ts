import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata = {
  summary: "Create NFT Token",
  description: "Creates a new NFT token (draft or minted).",
  operationId: "createNftToken",
  tags: ["NFT", "Tokens"],
  requiresAuth: true,
  requestBody: {
    description: "NFT token data",
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["collectionId", "name"],
          properties: {
            collectionId: { type: "string" },
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
    201: { description: "Token created successfully" },
    400: { description: "Bad Request" },
    401: { description: "Unauthorized" },
    404: { description: "Collection not found" },
    500: { description: "Internal Server Error" },
  },
};

export default async (data: Handler) => {
  const { user, body } = data;
  
  if (!user?.id) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  
  if (!body?.collectionId || !body?.name) {
    throw createError({ statusCode: 400, message: "collectionId and name are required" });
  }
  
  try {
    // Validate collection exists
    const collection = await models.nftCollection.findByPk(body.collectionId);
    if (!collection) {
      throw createError({ statusCode: 404, message: "Collection not found" });
    }
    
    // Find or create creator profile
    let creator = await models.nftCreator.findOne({ where: { userId: user.id } });
    if (!creator) {
      creator = await models.nftCreator.create({
        userId: user.id,
        displayName: `${user.firstName} ${user.lastName}`,
        profilePublic: true,
      });
    }
    
    // Auto-generate tokenId
    const lastToken = await models.nftToken.findOne({
      where: { collectionId: body.collectionId },
      order: [["tokenId", "DESC"]],
      attributes: ["tokenId"],
      raw: true,
    });
    const nextTokenNum = lastToken ? parseInt(lastToken.tokenId.replace(/\D/g, ""), 10) + 1 : 1;
    const tokenId = `${collection.symbol}${String(nextTokenNum).padStart(6, "0")}`;
    
    const token = await models.nftToken.create({
      collectionId: body.collectionId,
      tokenId,
      name: body.name,
      description: body.description || null,
      image: body.image || null,
      attributes: body.attributes || null,
      metadataUri: body.metadataUri || null,
      creatorId: creator.id,
      ownerId: null,
      status: "DRAFT",
      isMinted: false,
      isListed: false,
    });
    
    // Create activity
    await models.nftActivity.create({
      type: "MINT",
      tokenId: token.id,
      collectionId: body.collectionId,
      fromUserId: user.id,
      metadata: JSON.stringify({
        tokenName: body.name,
        collectionName: collection.name,
      }),
    });
    
    return token;
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error creating NFT token:", error);
    throw createError({ statusCode: 500, message: error.message || "Failed to create NFT token" });
  }
};