import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Get referral dashboard",
  operationId: "getReferralDashboard",
  tags: ["Finance", "Referral"],
  requiresAuth: true,
  responses: { 200: { description: "Dashboard retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const referralCode = user.id.substring(0, 8).toUpperCase();

  const referrals = await models.referral.findAll({
    where: { referrerId: user.id },
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  const totalReferrals = await models.referral.count({ where: { referrerId: user.id } });
  const activeReferrals = await models.referral.count({ where: { referrerId: user.id, status: "ACTIVE" } });

  const rewards = await models.referralReward.findAll({
    where: { userId: user.id, status: "CREDITED" },
  });
  const totalEarnings = rewards.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

  let tier: "BRONZE" | "SILVER" | "GOLD" = "BRONZE";
  if (totalReferrals >= 20) tier = "GOLD";
  else if (totalReferrals >= 5) tier = "SILVER";

  return {
    data: {
      referralCode, totalReferrals, activeReferrals,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      tier, referrals,
    },
  };
};
