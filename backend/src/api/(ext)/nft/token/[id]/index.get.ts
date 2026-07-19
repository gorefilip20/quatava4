import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata = {
  summary: "Get NFT Token Details",
  description: "Retrieves detailed information about a specific NFT token.",
  operationId: "getNftTokenById",
  tags: ["NFT", "Tokens"],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Token ID" },
  ],
  responses: {
    200: { description: "Token details retrieved successfully" },
    404: { description: "Token not found" },
    500: { description: "Internal Server Error" },
  },
};

export default async (data: Handler) => {
  const { params } = data;
  
  try {
    const token = await models.nftToken.findByPk(params.id, {
      include: [
        {
          model: models.nftCollection,
          as: "collection",
          required: false,
          include: [
            {
              model: models.nftCreator,
              as: "creator",
              include: [{ model: models.user, as: "user", attributes: ["id", "firstName", "lastName", "avatar"] }],
            },
          ],
        },
        {
          model: models.nftCreator,
          as: "creator",
          required: false,
          include: [
            { model: models.user, as: "user", attributes: ["id", "firstName", "lastName", "avatar"] },
          ],
        },
        {
          model: models.user,
          as: "owner",
          attributes: ["id", "firstName", "lastName", "avatar"],
          required: false,
        },
        {
          model: models.nftListing,
          as: "listings",
          required: false,
          where: { status: "ACTIVE" },
          include: [
            {
              model: models.nftBid,
              as: "bids",
              required: false,
              where: { status: "ACTIVE" },
              include: [{ model: models.user, as: "user", attributes: ["id", "firstName", "lastName"] }],
              order: [["amount", "DESC"]],
            },
            {
              model: models.user,
              as: "seller",
              attributes: ["id", "firstName", "lastName", "avatar"],
            },
          ],
        },
        {
          model: models.nftActivity,
          as: "activities",
          required: false,
          limit: 20,
          order: [["createdAt", "DESC"]],
          include: [
            { model: models.user, as: "fromUser", attributes: ["id", "firstName", "lastName", "avatar"] },
            { model: models.user, as: "toUser", attributes: ["id", "firstName", "lastName", "avatar"] },
          ],
        },
        {
          model: models.nftSale,
          as: "sales",
          required: false,
          order: [["createdAt", "DESC"]],
          limit: 10,
          include: [
            { model: models.user, as: "seller", attributes: ["id", "firstName", "lastName"] },
            { model: models.user, as: "buyer", attributes: ["id", "firstName", "lastName"] },
          ],
        },
        {
          model: models.nftOffer,
          as: "offers",
          required: false,
          where: { status: "ACTIVE" },
          include: [
            { model: models.user, as: "user", attributes: ["id", "firstName", "lastName", "avatar"] },
          ],
        },
      ],
    });
    
    if (!token) {
      throw createError({ statusCode: 404, message: "Token not found" });
    }
    
    // Increment views
    await token.increment("views");
    
    return token;
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error("Error fetching NFT token:", error);
    throw createError({ statusCode: 500, message: error.message || "Failed to fetch NFT token" });
  }
};