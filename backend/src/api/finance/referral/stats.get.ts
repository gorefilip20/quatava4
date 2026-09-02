import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { fn, col, literal } from "sequelize";

export const metadata: OperationObject = {
  summary: "Get referral stats",
  operationId: "getReferralStats",
  tags: ["Finance", "Referral"],
  requiresAuth: true,
  responses: { 200: { description: "Stats retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const monthly = await models.referral.findAll({
    where: { referrerId: user.id },
    attributes: [
      [fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "month"],
      [fn("COUNT", "*"), "count"],
      [fn("SUM", col("reward")), "earnings"],
    ],
    group: [literal("month")],
    order: [[literal("month"), "DESC"]],
    limit: 12,
    raw: true,
  });

  return { data: monthly };
};
