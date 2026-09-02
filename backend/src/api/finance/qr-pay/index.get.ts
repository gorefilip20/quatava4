import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List QR payments",
  operationId: "listQrPayments",
  tags: ["Finance", "QRPay"],
  requiresAuth: true,
  responses: { 200: { description: "QR payments list" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const sent = await models.transaction.findAll({
    where: { userId: user.id, type: "TRANSFER" },
    order: [["createdAt", "DESC"]],
    limit: 50,
    raw: true,
  });

  const payments = sent.map((tx: any) => ({
    id: tx.id,
    type: tx.amount < 0 ? "PAY" : "RECEIVE",
    amount: Math.abs(tx.amount),
    currency: tx.currency || "USDT",
    status: tx.status || "COMPLETED",
    createdAt: tx.createdAt,
  }));

  return { data: payments };
};
