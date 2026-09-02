import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Create a savings group",
  operationId: "createSavingsGroup",
  tags: ["Finance", "SavingsGroup"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            currency: { type: "string" },
            contributionAmount: { type: "number" },
            frequency: { type: "string", enum: ["WEEKLY", "BIWEEKLY", "MONTHLY"] },
            maxMembers: { type: "integer" },
          },
          required: ["name", "contributionAmount", "frequency", "maxMembers"],
        },
      },
    },
  },
  responses: { 200: { description: "Group created" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { name, description, currency = "USDT", contributionAmount, frequency, maxMembers } = body;
  if (!name || !contributionAmount || !frequency || !maxMembers)
    throw createError(400, "Missing required fields");
  if (maxMembers < 2 || maxMembers > 20) throw createError(400, "Max members must be 2-20");

  const result = await sequelize.transaction(async (t) => {
    const group = await models.savingsGroup.create({
      name, description: description || null, currency,
      contributionAmount, frequency, maxMembers,
      totalRounds: maxMembers, status: "FORMING", creatorId: user.id,
    }, { transaction: t });

    await models.savingsGroupMember.create({
      groupId: group.id, userId: user.id, payoutOrder: 1,
      joinedAt: new Date(), status: "ACTIVE",
    }, { transaction: t });

    await group.update({ currentMembers: 1 }, { transaction: t });
    return group;
  });

  return { message: "Savings group created", data: result };
};
