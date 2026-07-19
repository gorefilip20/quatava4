import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { fn, col } from "sequelize";

export const metadata = {
  summary: "Get NFT categories",
  description: "Returns all active NFT categories with collection counts",
  operationId: "getNftCategories",
  tags: ["NFT", "Categories"],
  parameters: [],
  responses: {
    200: { description: "Categories retrieved successfully" },
    500: { description: "Internal Server Error" },
  },
};

export default async (data: Handler) => {
  try {
    const categories = await models.nftCategory.findAll({
      where: { status: true },
      attributes: {
        include: [
          [
            fn("COALESCE", 
              fn("COUNT", col("nftCollection.id")), 
              0
            ),
            "collectionsCount",
          ],
        ],
      },
      include: [
        {
          model: models.nftCollection,
          as: "collections",
          attributes: [],
          required: false,
        },
      ],
      group: ["nftCategory.id"],
      order: [["name", "ASC"]],
      subQuery: false,
    });

    return categories;
  } catch (error: any) {
    console.error("Error fetching NFT categories:", error);
    throw createError({ statusCode: 500, message: error.message || "Failed to fetch categories" });
  }
};
