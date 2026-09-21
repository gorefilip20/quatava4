import { createError } from "@b/utils/error";
import { createRemittanceIntent, dispatchRemittance, reconcileRemittance, verifyQuote } from "@b/utils/remittance";

export const metadata: OperationObject = {
  summary: "Create an idempotent LATAM remittance intent",
  operationId: "createRemittanceIntent",
  tags: ["Remittance"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: { "application/json": { schema: { type: "object", required: ["quoteId", "recipient"], properties: { quoteId: { type: "string" }, recipient: { type: "object" } } } } },
  },
  responses: {
    200: { description: "Remittance intent created" },
    400: { description: "Invalid quote, recipient, or balance" },
    401: { description: "Unauthorized" },
  },
};

export default async (data: Handler) => {
  if (!data.user?.id) throw createError(401, "Unauthorized");
  const idempotencyKey = data.headers?.["idempotency-key"] || data.headers?.["Idempotency-Key"];
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) throw createError(400, "A valid Idempotency-Key header is required");
  const body = data.body || {};
  if (!body.quoteId || !body.recipient?.name || !body.recipient?.account || !body.recipient?.country) throw createError(400, "quoteId and recipient name, account, and country are required");
  let quote;
  try { quote = verifyQuote(body.quoteId); } catch (error: any) { throw createError(400, error.message); }
  try {
    const transaction = await createRemittanceIntent({ userId: data.user.id, quote, recipient: { name: String(body.recipient.name), account: String(body.recipient.account), country: String(body.recipient.country) }, idempotencyKey: String(idempotencyKey) });
    if (quote.provider !== "preview" && transaction.status === "PENDING") {
      try {
        const dispatched = await dispatchRemittance({ transactionId: transaction.id, referenceId: String(transaction.referenceId), quote, recipient: { name: String(body.recipient.name), account: String(body.recipient.account), country: String(body.recipient.country) } });
        let existingMetadata: Record<string, unknown> = {};
        try { existingMetadata = JSON.parse(transaction.metadata || "{}"); } catch {}
        await transaction.update({ status: "PROCESSING", trxId: dispatched.providerReference, metadata: JSON.stringify({ ...existingMetadata, providerDispatchedAt: new Date().toISOString(), providerReference: dispatched.providerReference }) });
      } catch (providerError: any) {
        await reconcileRemittance({ referenceId: String(transaction.referenceId), status: "FAILED", providerPayload: { dispatchError: providerError.message } });
      }
    }
    return { status: true, data: { id: transaction.id, referenceId: transaction.referenceId, status: transaction.status, amount: transaction.amount, fee: transaction.fee, corridor: quote.corridor, recipientAmount: quote.recipientAmount, provider: quote.provider, preview: quote.preview } };
  } catch (error: any) {
    const message = error?.name === "SequelizeUniqueConstraintError" ? "Idempotency key was already used with a different request" : error.message;
    throw createError(400, message);
  }
};
