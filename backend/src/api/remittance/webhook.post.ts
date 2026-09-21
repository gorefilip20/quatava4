import { createError } from "@b/utils/error";
import { reconcileRemittance, verifyWebhookSignature } from "@b/utils/remittance";

export const metadata: OperationObject = { summary: "Reconcile a settlement-provider remittance webhook", operationId: "reconcileRemittanceWebhook", tags: ["Remittance", "Webhooks"], requiresAuth: false, requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["referenceId", "status"], properties: { referenceId: { type: "string" }, status: { type: "string" }, providerReference: { type: "string" } } } } } }, responses: { 200: { description: "Webhook acknowledged" }, 400: { description: "Invalid webhook payload" }, 401: { description: "Invalid webhook signature" } } };

export default async (data: Handler) => {
  const signature = data.headers?.["x-quatava-signature"] || data.headers?.["X-Quatava-Signature"];
  const rawBody = JSON.stringify(data.body || {});
  if (!verifyWebhookSignature(rawBody, signature)) throw createError(401, "Invalid webhook signature");
  const body = data.body || {};
  if (!body.referenceId || !["COMPLETED", "FAILED"].includes(body.status)) throw createError(400, "referenceId and a valid status are required");
  const transaction = await reconcileRemittance({ referenceId: String(body.referenceId), status: body.status, providerReference: body.providerReference ? String(body.providerReference) : undefined, providerPayload: body });
  return { status: true, acknowledged: true, matched: Boolean(transaction) };
};
