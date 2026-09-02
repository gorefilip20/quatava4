import { models } from "@b/db";
import { createError } from "@b/utils/error";
import crypto from "crypto";

export const metadata: OperationObject = {
  summary: "Generate QR payment code",
  operationId: "generateQrPayment",
  tags: ["Finance", "QRPay"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            amount: { type: "number" },
            currency: { type: "string" },
            description: { type: "string" },
          },
          required: ["amount", "currency"],
        },
      },
    },
  },
  responses: { 200: { description: "QR code generated" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { amount, currency, description = "" } = body;
  if (!amount || amount <= 0) throw createError(400, "Invalid amount");

  const paymentId = crypto.randomUUID();
  const qrData = JSON.stringify({
    paymentId, amount, currency, userId: user.id,
    description, expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
  });

  return {
    data: {
      paymentId, qrData,
      expiresAt: new Date(Date.now() + 15 * 60000),
    },
  };
};
