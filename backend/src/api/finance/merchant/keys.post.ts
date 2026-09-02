import { models } from "@b/db";
import { createError } from "@b/utils/error";
import crypto from "crypto";

export const metadata: OperationObject = {
  summary: "Regenerate merchant API keys",
  operationId: "regenerateMerchantKeys",
  tags: ["Finance", "Merchant"],
  requiresAuth: true,
  responses: { 200: { description: "Keys regenerated" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const profile = await models.merchantProfile.findOne({ where: { userId: user.id } });
  if (!profile) throw createError(404, "Merchant profile not found");

  const apiKey = crypto.randomBytes(32).toString("hex");
  const secretKey = crypto.randomBytes(64).toString("hex");

  await profile.update({ apiKey, secretKey });
  return { message: "API keys regenerated", data: { apiKey, secretKey } };
};
