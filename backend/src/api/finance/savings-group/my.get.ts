import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List user's savings groups",
  operationId: "listMySavingsGroups",
  tags: ["Finance", "SavingsGroup"],
  requiresAuth: true,
  responses: { 200: { description: "Groups retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const memberships = await models.savingsGroupMember.findAll({
    where: { userId: user.id, status: "ACTIVE" },
    include: [{ model: models.savingsGroup, as: "group" }],
  });

  const groups = memberships.map((m: any) => ({
    ...m.group?.dataValues,
    myContribution: m.totalContributed,
    myPayoutOrder: m.payoutOrder,
    hasReceivedPayout: m.hasReceivedPayout,
  }));

  return { data: groups };
};
