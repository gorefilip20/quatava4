import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List user's DCA plans",
  operationId: "listDcaPlans",
  tags: ["Finance", "DCA"],
  requiresAuth: true,
  responses: { 200: { description: "DCA plans retrieved successfully" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const plans = await models.dcaPlan.findAll({
    where: { userId: user.id },
    order: [["createdAt", "DESC"]],
  });

  return { data: plans };
};
