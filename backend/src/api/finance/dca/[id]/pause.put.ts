import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Pause a DCA plan",
  operationId: "pauseDcaPlan",
  tags: ["Finance", "DCA"],
  requiresAuth: true,
  responses: { 200: { description: "Plan paused" } },
};

export default async (data: Handler) => {
  const { user, params } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const plan = await models.dcaPlan.findOne({
    where: { id: params.id, userId: user.id, status: "ACTIVE" },
  });
  if (!plan) throw createError(404, "Active DCA plan not found");

  await plan.update({ status: "PAUSED" });
  return { message: "DCA plan paused" };
};
