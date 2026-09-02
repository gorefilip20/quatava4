import { models } from "@b/db";
import { createError } from "@b/utils/error";
import crypto from "crypto";

export const metadata: OperationObject = {
  summary: "Create merchant profile",
  operationId: "createMerchantProfile",
  tags: ["Finance", "Merchant"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            businessName: { type: "string" },
            businessType: { type: "string" },
            website: { type: "string" },
            callbackUrl: { type: "string" },
            acceptedCurrencies: { type: "array", items: { type: "string" } },
          },
          required: ["businessName", "businessType"],
        },
      },
    },
  },
  responses: { 200: { description: "Profile created" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const existing = await models.merchantProfile.findOne({ where: { userId: user.id } });
  if (existing) throw createError(400, "Merchant profile already exists");

  const { businessName, businessType, website, callbackUrl, acceptedCurrencies = ["USDT", "BTC", "ETH"] } = body;
  if (!businessName || !businessType) throw createError(400, "Missing required fields");

  const profile = await models.merchantProfile.create({
    userId: user.id, businessName, businessType, website: website || null,
    apiKey: crypto.randomBytes(32).toString("hex"),
    secretKey: crypto.randomBytes(64).toString("hex"),
    callbackUrl: callbackUrl || null,
    acceptedCurrencies: JSON.stringify(acceptedCurrencies),
    status: "ACTIVE",
  });

  return { message: "Merchant profile created", data: profile };
};
