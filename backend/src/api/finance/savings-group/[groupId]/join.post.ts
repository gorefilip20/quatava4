import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Join a savings group",
  operationId: "joinSavingsGroup",
  tags: ["Finance", "SavingsGroup"],
  requiresAuth: true,
  responses: { 200: { description: "Joined group" } },
};

export default async (data: Handler) => {
  const { user, params } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const group = await models.savingsGroup.findByPk(params.groupId);
  if (!group) throw createError(404, "Group not found");
  if (group.status !== "FORMING") throw createError(400, "Group is no longer accepting members");
  if (group.currentMembers >= group.maxMembers) throw createError(400, "Group is full");

  const existing = await models.savingsGroupMember.findOne({
    where: { groupId: group.id, userId: user.id, status: "ACTIVE" },
  });
  if (existing) throw createError(400, "Already a member");

  await sequelize.transaction(async (t) => {
    await models.savingsGroupMember.create({
      groupId: group.id, userId: user.id,
      payoutOrder: group.currentMembers + 1,
      joinedAt: new Date(), status: "ACTIVE",
    }, { transaction: t });

    const newCount = group.currentMembers + 1;
    const updates: any = { currentMembers: newCount };
    if (newCount >= group.maxMembers) {
      updates.status = "ACTIVE";
      updates.startDate = new Date();
    }
    await group.update(updates, { transaction: t });
  });

  return { message: "Joined savings group" };
};
