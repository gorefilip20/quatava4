import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = { summary: "Get remittance status", operationId: "getRemittanceStatus", tags: ["Remittance"], requiresAuth: true, responses: { 200: { description: "Remittance status" }, 401: { description: "Unauthorized" }, 404: { description: "Remittance not found" } } };

export default async (data: Handler) => {
  if (!data.user?.id) throw createError(401, "Unauthorized");
  const transaction = await models.transaction.findOne({ where: { id: data.params.id, userId: data.user.id, type: "OUTGOING_TRANSFER" } });
  if (!transaction) throw createError(404, "Remittance not found");
  let metadata: any = {};
  try { metadata = JSON.parse(transaction.metadata || "{}"); } catch {}
  return { status: true, data: { id: transaction.id, referenceId: transaction.referenceId, status: transaction.status, amount: transaction.amount, fee: transaction.fee, currency: metadata.fromCurrency, recipientCurrency: metadata.toCurrency, recipientAmount: metadata.recipientAmount, corridor: metadata.corridor, recipient: metadata.recipient, provider: metadata.provider, createdAt: transaction.createdAt, updatedAt: transaction.updatedAt, receipt: transaction.status === "COMPLETED" ? { providerReference: transaction.trxId, deliveredAt: metadata.reconciledAt } : null } };
};
