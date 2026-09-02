import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Leave a savings group",
  operationId: "leaveSavingsGroup",
  tags: ["Finance", "SavingsGroup"],
  requiresAuth: true,
  responses: { 200: { description: "Left group" } },
};

export default async (data: Handler) => {
  const { user, params } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const group = await models.savingsGroup.findByPk(params.groupId);
  if (!group) throw createError(404, "Group not found");
  if (group.status !== "FORMING") throw createError(400, "Can only leave groups that are still forming");

  const member = await models.savingsGroupMember.findOne({
    where: { groupId: group.id, userId: user.id, status: "ACTIVE" },
  });
  if (!member) throw createError(404, "Not a member");

  await sequelize.transaction(async (t) => {
    await member.update({ status: "LEFT" }, { transaction: t });
    await group.update({ currentMembers: Math.max(0, group.currentMembers - 1) }, { transaction: t });
  });

  return { message: "Left savings group" };
};
