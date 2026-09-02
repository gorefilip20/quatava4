import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Contribute to savings group",
  operationId: "contributeSavingsGroup",
  tags: ["Finance", "SavingsGroup"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: { amount: { type: "number" } },
          required: ["amount"],
        },
      },
    },
  },
  responses: { 200: { description: "Contribution made" } },
};

export default async (data: Handler) => {
  const { user, params, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { amount } = body;
  const group = await models.savingsGroup.findByPk(params.groupId);
  if (!group) throw createError(404, "Group not found");
  if (group.status !== "ACTIVE") throw createError(400, "Group is not active");

  const member = await models.savingsGroupMember.findOne({
    where: { groupId: group.id, userId: user.id, status: "ACTIVE" },
  });
  if (!member) throw createError(403, "Not a member");
  if (Math.abs(amount - group.contributionAmount) > 0.01)
    throw createError(400, `Contribution must be exactly ${group.contributionAmount}`);

  const wallet = await models.wallet.findOne({
    where: { userId: user.id, currency: group.currency, type: "SPOT" },
  });
  if (!wallet) throw createError(404, "Wallet not found");
  if (wallet.balance < amount) throw createError(400, "Insufficient balance");

  await sequelize.transaction(async (t) => {
    await wallet.update({ balance: wallet.balance - amount }, { transaction: t });
    await member.update({ totalContributed: member.totalContributed + amount }, { transaction: t });

    const allMembers = await models.savingsGroupMember.findAll({
      where: { groupId: group.id, status: "ACTIVE" },
    });

    const contributedThisRound = allMembers.filter(
      (m: any) => m.totalContributed >= group.contributionAmount * group.currentRound
    ).length;

    if (contributedThisRound >= group.currentMembers) {
      const recipient = allMembers.find((m: any) => m.payoutOrder === group.currentRound);
      if (recipient) {
        const payout = group.contributionAmount * group.currentMembers;
        let recipientWallet = await models.wallet.findOne({
          where: { userId: recipient.userId, currency: group.currency, type: "SPOT" },
        });
        if (!recipientWallet) {
          recipientWallet = await models.wallet.create({
            userId: recipient.userId, currency: group.currency, type: "SPOT", balance: 0, status: true,
          }, { transaction: t });
        }
        await recipientWallet.update({ balance: recipientWallet.balance + payout }, { transaction: t });
        await recipient.update({ hasReceivedPayout: true }, { transaction: t });
      }

      const nextRound = group.currentRound + 1;
      if (nextRound > group.totalRounds) {
        await group.update({ status: "COMPLETED", currentRound: group.currentRound }, { transaction: t });
      } else {
        await group.update({ currentRound: nextRound }, { transaction: t });
      }
    }
  });

  return { message: "Contribution recorded" };
};
