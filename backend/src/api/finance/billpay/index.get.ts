import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List user's bill payments",
  operationId: "listBillPayments",
  tags: ["Finance", "BillPay"],
  requiresAuth: true,
  responses: { 200: { description: "Payments retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const payments = await models.billPayment.findAll({
    where: { userId: user.id },
    include: [{ model: models.billCategory, as: "category" }],
    order: [["createdAt", "DESC"]],
  });

  return { data: payments };
};
