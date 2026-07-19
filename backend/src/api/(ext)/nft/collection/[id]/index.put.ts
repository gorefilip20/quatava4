import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata = {
  summary: "Update NFT Collection",
  description: "Update an existing NFT collection. Only the collection creator can update. Collections in DRAFT, PENDING, or ACTIVE status can be updated.",
  operationId: "updateNftCollection",
  tags: ["NFT", "Collections"],
  requiresAuth: true,
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
      description: "Collection UUID",
    },
  ],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Collection name" },
            symbol: { type: "string", description: "Collection token symbol" },
            description: { type: "string", description: "Collection description" },
            chain: { type: "string", description: "Blockchain" },
            network: { type: "string", description: "Network" },
            standard: { type: "string", description: "Token standard" },
            maxSupply: { type: "integer", description: "Maximum token supply" },
            mintPrice: { type: "string", description: "Mint price" },
            currency: { type: "string", description: "Currency" },
            royaltyPercentage: { type: "number", description: "Royalty percentage" },
            royaltyAddress: { type: "string", description: "Royalty address" },
            categoryId: { type: "string", description: "Category UUID" },
            bannerImage: { type: "string", description: "Banner image URL" },
            logoImage: { type: "string", description: "Logo image URL" },
            featuredImage: { type: "string", description: "Featured image URL" },
            website: { type: "string", description: "Website URL" },
            discord: { type: "string", description: "Discord link" },
            twitter: { type: "string", description: "Twitter link" },
            telegram: { type: "string", description: "Telegram link" },
            isLazyMinted: { type: "boolean", description: "Lazy minting flag" },
            metadata: { type: "object", description: "Additional metadata" },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Collection updated successfully",
      content: {
        "application/json": {
          schema: { type: "object" },
        },
      },
    },
    400: { description: "Bad request / validation error" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - not the collection creator" },
    404: { description: "Collection not found" },
    409: { description: "Collection status does not allow updates" },
    500: { description: "Internal server error" },
  },
};

// Fields that are allowed to be updated
const ALLOWED_UPDATE_FIELDS = [
  "name",
  "symbol",
  "description",
  "chain",
  "network",
  "standard",
  "maxSupply",
  "mintPrice",
  "currency",
  "royaltyPercentage",
  "royaltyAddress",
  "categoryId",
  "bannerImage",
  "logoImage",
  "featuredImage",
  "website",
  "discord",
  "twitter",
  "telegram",
  "isLazyMinted",
  "metadata",
];

// Statuses that allow updates
const UPDATABLE_STATUSES = ["DRAFT", "PENDING", "ACTIVE"];

export default async function (data: Handler) {
  const { user, params, body } = data;

  try {
    if (!user?.id) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const { id } = params;

    if (!id) {
      throw createError({ statusCode: 400, message: "Collection ID is required" });
    }

    // Find the collection
    const collection = await models.nftCollection.findByPk(id, {
      include: [
        {
          model: models.nftCreator,
          as: "creator",
        },
      ],
    });

    if (!collection) {
      throw createError({ statusCode: 404, message: "Collection not found" });
    }

    // Verify the user is the creator
    const creator = await models.nftCreator.findOne({
      where: { userId: user.id },
    });

    if (!creator || collection.creatorId !== creator.id) {
      throw createError({
        statusCode: 403,
        message: "You are not authorized to update this collection",
      });
    }

    // Check if collection status allows updates
    if (!UPDATABLE_STATUSES.includes(collection.status)) {
      throw createError({
        statusCode: 409,
        message: `Cannot update collection in ${collection.status} status. Only DRAFT, PENDING, or ACTIVE collections can be updated.`,
      });
    }

    // Build update payload with only allowed fields
    const updateData: Record<string, any> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // If no valid fields to update, reject
    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: "No valid fields provided for update",
      });
    }

    // If name is being updated, regenerate slug
    if (updateData.name) {
      const newSlug = updateData.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      // Check slug uniqueness (exclude current collection)
      const existingSlug = await models.nftCollection.findOne({
        where: {
          slug: newSlug,
          id: { [models.nftCollection.sequelize!.Sequelize.Op.ne]: id },
        },
      });

      updateData.slug = existingSlug ? `${newSlug}-${Date.now()}` : newSlug;
    }

    // Validate categoryId if being updated
    if (updateData.categoryId) {
      const category = await models.nftCategory.findByPk(updateData.categoryId);
      if (!category) {
        throw createError({ statusCode: 400, message: "Invalid categoryId: category not found" });
      }
    }

    // Perform update
    await collection.update(updateData);

    // Fetch updated collection with associations
    const updatedCollection = await models.nftCollection.findByPk(id, {
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
      ],
    });

    return updatedCollection;
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
      message: error instanceof Error ? error.message : "Failed to update collection",
    });
  }
};
