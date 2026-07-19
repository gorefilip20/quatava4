import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op, fn, col } from "sequelize";

export const metadata = {
  summary: "Get chain statistics",
  description:
    "Retrieves NFT marketplace statistics grouped by blockchain chain.",
  operationId: "getChainStats",
  tags: ["NFT", "Stats", "Chains"],
  responses: {
    200: { description: "Chain statistics retrieved successfully" },
    500: { description: "Internal Server Error" },
  },
};

export default async function (data: Handler) {
  try {
    // Get collection counts grouped by chain
    const collectionsByChain = await models.nftCollection.findAll({
      attributes: [
        "chain",
        [fn("COUNT", col("id")), "collectionCount"],
      ],
      group: ["chain"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      raw: true,
    });

    // For each chain, compute token count by querying nftToken through collection
    const chainStats = await Promise.all(
      collectionsByChain.map(async (row: any) => {
        const chain = row.chain;

        // Find all collection IDs for this chain
        const collections = await models.nftCollection.findAll({
          attributes: ["id"],
          where: { chain },
          raw: true,
        });

        const collectionIds = collections.map((c: any) => c.id);

        let tokenCount = 0;
        if (collectionIds.length > 0) {
          tokenCount = await models.nftToken.count({
            where: {
              collectionId: { [Op.in]: collectionIds },
              status: "MINTED",
            },
          });
        }

        return {
          chain,
          collectionCount: parseInt(row.collectionCount, 10),
          tokenCount,
        };
      })
    );

    return chainStats;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to fetch chain statistics",
    });
  }
}
