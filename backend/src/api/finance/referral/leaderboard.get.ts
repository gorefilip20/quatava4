import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";
import { fn, col, literal } from "sequelize";

export const metadata: OperationObject = {
  summary: "Get referral leaderboard",
  operationId: "getReferralLeaderboard",
  tags: ["Finance", "Referral"],
  requiresAuth: true,
  responses: { 200: { description: "Leaderboard retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const leaders = await models.referral.findAll({
    attributes: [
      "referrerId",
      [fn("COUNT", col("referrerId")), "referralCount"],
      [fn("SUM", col("reward")), "totalEarnings"],
    ],
    group: ["referrerId"],
    order: [[literal("referralCount"), "DESC"]],
    limit: 10,
    raw: true,
  });

  const leaderboard = [];
  for (let i = 0; i < leaders.length; i++) {
    const entry = leaders[i] as any;
    const u = await models.user.findByPk(entry.referrerId, {
      attributes: ["firstName", "lastName"],
    });
    const name = u
      ? `${u.firstName || "User"} ${(u.lastName || "").charAt(0)}.`
      : "Anonymous";

    leaderboard.push({
      rank: i + 1,
      name,
      referralCount: parseInt(entry.referralCount) || 0,
      earnings: parseFloat(entry.totalEarnings) || 0,
    });
  }

  return { data: leaderboard };
};
