import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op, fn, col } from "sequelize";

export const metadata = {
  summary: "Get NFT Collection Details",
  description: "Retrieve detailed information about a single NFT collection by UUID.",
  operationId: "getNftCollection",
  tags: ["NFT", "Collections"],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
      description: "Collection UUID",
    },
  ],
  responses: {
    200: { description: "Collection details retrieved" },
    404: { description: "Collection not found" },
    500: { description: "Internal server error" },
  },
};

export default async (data: Handler) => {
  const { params } = data;

  try {
    const { id } = params;

    if (!id) {
      throw createError({ statusCode: 400, message: "Collection ID is required" });
    }

    const collection = await models.nftCollection.findByPk(id, {
      include: [
        {
          model: models.nftCreator,
          as: "creator",
          include: [
            {
              model: models.user,
              as: "user",
              attributes: ["id", "firstName", "lastName", "email", "avatar"],
            },
          ],
        },
        {
          model: models.nftCategory,
          as: "category",
        },
        {
          model: models.nftToken,
          as: "tokens",
          required: false,
          limit: 20,
          order: [["createdAt", "DESC"]],
          include: [
            {
              model: models.user,
              as: "owner",
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
            {
              model: models.user,
              as: "fromUser",
              attributes: ["id", "firstName", "lastName", "avatar"],
            },
            {
              model: models.user,
              as: "toUser",
              attributes: ["id", "firstName", "lastName", "avatar"],
            },
          ],
        },
      ],
    });

    if (!collection) {
      throw createError({ statusCode: 404, message: "Collection not found" });
    }

    // Compute stats
    const tokenCount = await models.nftToken.count({
      where: { collectionId: id },
    });

    const totalOwners = await models.nftToken.count({
      where: { collectionId: id, ownerId: { [Op.ne]: null } },
      distinct: true,
      col: "ownerId",
    });

    // Get sales volume from nftSale model
    const volumeResult = await models.nftSale.findOne({
      attributes: [
        [fn("COALESCE", fn("SUM", col("price")), 0), "totalVolume"],
        [fn("COUNT", col("id")), "salesCount"],
      ],
      include: [
        {
          model: models.nftToken,
          as: "token",
          where: { collectionId: id },
          attributes: [],
        },
      ],
      where: { status: "COMPLETED" },
      raw: true,
    });

    const totalVolume = parseFloat(volumeResult?.totalVolume || "0");
    const salesCount = parseInt(volumeResult?.salesCount || "0", 10);

    // Count listed tokens (isListed = true)
    const listedCount = await models.nftToken.count({
      where: { collectionId: id, isListed: true },
    });

    // Get floor price from active listings
    const floorPriceResult = await models.nftListing.findOne({
      attributes: [[fn("MIN", col("price")), "floorPrice"]],
      include: [
        {
          model: models.nftToken,
          as: "token",
          where: { collectionId: id },
          attributes: [],
        },
      ],
      where: { status: "ACTIVE" },
      raw: true,
    });

    const floorPrice = parseFloat(floorPriceResult?.floorPrice || "0");

    // Get highest sale
    const highestSaleResult = await models.nftSale.findOne({
      attributes: [[fn("MAX", col("price")), "highestSale"]],
      include: [
        {
          model: models.nftToken,
          as: "token",
          where: { collectionId: id },
          attributes: [],
        },
      ],
      where: { status: "COMPLETED" },
      raw: true,
    });

    const highestSale = parseFloat(highestSaleResult?.highestSale || "0");

    const collectionData = collection.toJSON();

    return {
      ...collectionData,
      stats: {
        tokenCount,
        totalOwners,
        totalVolume,
        salesCount,
        listedCount,
        floorPrice,
        highestSale,
      },
    };
  } catch (error: any) {
    if (error?.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to fetch collection",
    });
  }
};
