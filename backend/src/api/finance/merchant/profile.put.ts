import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Update merchant profile",
  operationId: "updateMerchantProfile",
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
        },
      },
    },
  },
  responses: { 200: { description: "Profile updated" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const profile = await models.merchantProfile.findOne({ where: { userId: user.id } });
  if (!profile) throw createError(404, "Merchant profile not found");

  const updates: any = {};
  if (body.businessName) updates.businessName = body.businessName;
  if (body.businessType) updates.businessType = body.businessType;
  if (body.website !== undefined) updates.website = body.website;
  if (body.callbackUrl !== undefined) updates.callbackUrl = body.callbackUrl;
  if (body.acceptedCurrencies) updates.acceptedCurrencies = JSON.stringify(body.acceptedCurrencies);

  await profile.update(updates);
  return { message: "Profile updated", data: profile };
};
