import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List user's remittances",
  operationId: "listRemittances",
  tags: ["Finance", "Remittance"],
  requiresAuth: true,
  responses: { 200: { description: "Remittances retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const remittances = await models.remittance.findAll({
    where: { userId: user.id },
    order: [["createdAt", "DESC"]],
  });

  return { data: remittances };
};
