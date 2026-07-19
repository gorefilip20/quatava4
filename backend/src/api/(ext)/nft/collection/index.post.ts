import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata = {
  summary: "Create NFT Collection",
  description: "Create a new NFT collection. Requires authentication. The collection is created in DRAFT status.",
  operationId: "createNftCollection",
  tags: ["NFT", "Collections"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["name", "chain", "network"],
          properties: {
            name: { type: "string", description: "Collection name" },
            symbol: { type: "string", description: "Collection token symbol" },
            description: { type: "string", description: "Collection description" },
            chain: { type: "string", description: "Blockchain (e.g., ethereum, solana, polygon)" },
            network: { type: "string", description: "Network (e.g., mainnet, testnet)" },
            standard: { type: "string", enum: ["ERC721", "ERC1155", "SPL", "BEP721", "BEP1155"], description: "Token standard" },
            maxSupply: { type: "integer", description: "Maximum token supply" },
            mintPrice: { type: "string", description: "Mint price as string (wei)" },
            currency: { type: "string", description: "Currency for mint price" },
            royaltyPercentage: { type: "number", description: "Royalty percentage (0-100)" },
            royaltyAddress: { type: "string", description: "Address to receive royalties" },
            categoryId: { type: "string", description: "Category UUID" },
            bannerImage: { type: "string", description: "Banner image URL" },
            logoImage: { type: "string", description: "Logo image URL" },
            featuredImage: { type: "string", description: "Featured image URL" },
            website: { type: "string", description: "Project website URL" },
            discord: { type: "string", description: "Discord invite link" },
            twitter: { type: "string", description: "Twitter/X profile URL" },
            telegram: { type: "string", description: "Telegram group link" },
            isLazyMinted: { type: "boolean", description: "Whether collection supports lazy minting" },
            metadata: { type: "object", description: "Additional metadata as JSON" },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Collection created successfully",
      content: {
        "application/json": {
          schema: { type: "object" },
        },
      },
    },
    400: { description: "Bad request / validation error" },
    401: { description: "Unauthorized" },
    500: { description: "Internal server error" },
  },
};

export default async function (data: Handler) {
  const { user, body } = data;

  try {
    if (!user?.id) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const {
      name,
      symbol,
      description,
      chain,
      network,
      standard,
      maxSupply,
      mintPrice,
      currency,
      royaltyPercentage,
      royaltyAddress,
      categoryId,
      bannerImage,
      logoImage,
      featuredImage,
      website,
      discord,
      twitter,
      telegram,
      isLazyMinted,
      metadata: extraMetadata,
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      throw createError({ statusCode: 400, message: "Collection name is required" });
    }

    if (!chain) {
      throw createError({ statusCode: 400, message: "Chain is required" });
    }

    if (!network) {
      throw createError({ statusCode: 400, message: "Network is required" });
    }

    // Auto-generate symbol from name if not provided
    if (!symbol || !symbol.trim()) {
      body.symbol = name.trim().substring(0, 10).toUpperCase();
    }

    // Auto-generate slug from name: lowercase, replace spaces with hyphens, strip non-alphanumeric
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Check slug uniqueness
    const existingCollection = await models.nftCollection.findOne({
      where: { slug },
    });

    const finalSlug = existingCollection
      ? `${slug}-${Date.now()}`
      : slug;

    // Find or create nftCreator for user
    let [creator] = await models.nftCreator.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id },
    });

    // Validate categoryId if provided
    if (categoryId) {
      const category = await models.nftCategory.findByPk(categoryId);
      if (!category) {
        throw createError({ statusCode: 400, message: "Invalid categoryId: category not found" });
      }
    }

    // Create collection
    const collection = await models.nftCollection.create({
      name: name.trim(),
      slug: finalSlug,
      symbol: symbol || name.trim().substring(0, 10).toUpperCase(),
      description: description || null,
      chain,
      network,
      standard: standard || null,
      maxSupply: maxSupply || null,
      mintPrice: mintPrice || "0",
      currency: currency || null,
      royaltyPercentage: royaltyPercentage || 0,
      royaltyAddress: royaltyAddress || null,
      categoryId: categoryId || null,
      creatorId: creator.id,
      bannerImage: bannerImage || null,
      logoImage: logoImage || null,
      featuredImage: featuredImage || null,
      website: website || null,
      discord: discord || null,
      twitter: twitter || null,
      telegram: telegram || null,
      isLazyMinted: isLazyMinted || false,
      status: "DRAFT",
      metadata: extraMetadata || null,
    });

    // Create activity record
    await models.nftActivity.create({
      type: "COLLECTION_CREATED",
      collectionId: collection.id,
      fromUserId: user.id,
      metadata: JSON.stringify({
        collectionName: collection.name,
        chain: collection.chain,
        network: collection.network,
      }),
    });

    return collection;
  } catch (error: any) {
    if (error?.name === "SequelizeValidationError") {
      throw createError({
        statusCode: 400,
        message: "Validation error",
        details: error.errors?.map((e: any) => e.message),
      });
    }
    if (error?.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : "Failed to create collection",
    });
  }
};
