import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Get merchant profile",
  operationId: "getMerchantProfile",
  tags: ["Finance", "Merchant"],
  requiresAuth: true,
  responses: { 200: { description: "Profile retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const profile = await models.merchantProfile.findOne({ where: { userId: user.id } });
  return { data: profile };
};
