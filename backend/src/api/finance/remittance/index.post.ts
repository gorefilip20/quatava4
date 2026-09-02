import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Create a remittance",
  operationId: "createRemittance",
  tags: ["Finance", "Remittance"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            sendCurrency: { type: "string" },
            sendAmount: { type: "number" },
            receiveCurrency: { type: "string" },
            recipientName: { type: "string" },
            recipientAccount: { type: "string" },
            recipientBank: { type: "string" },
          },
          required: ["sendCurrency", "sendAmount", "receiveCurrency", "recipientName", "recipientAccount"],
        },
      },
    },
  },
  responses: { 200: { description: "Remittance created" } },
};

const RATES: Record<string, number> = {
  "USDT-BRL": 4.97, "USDT-ARS": 350, "USDT-CLP": 880, "USDT-COP": 3950,
  "USDT-MXN": 17.1, "USDT-PEN": 3.72, "USDT-VES": 36.5, "USDT-UYU": 39.2,
  "USDT-BOB": 6.91, "USDT-PYG": 7280, "USDT-USD": 1,
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { sendCurrency, sendAmount, receiveCurrency, recipientName, recipientAccount, recipientBank } = body;
  if (!sendCurrency || !sendAmount || !receiveCurrency || !recipientName || !recipientAccount)
    throw createError(400, "Missing required fields");

  const key = `${sendCurrency}-${receiveCurrency}`;
  const rate = RATES[key];
  if (!rate) throw createError(400, `Corridor ${key} not supported`);

  const fee = Math.max(1, sendAmount * 0.025);
  const totalDebit = sendAmount + fee;

  const wallet = await models.wallet.findOne({
    where: { userId: user.id, currency: sendCurrency, type: "SPOT" },
  });
  if (!wallet) throw createError(404, "Wallet not found");
  if (wallet.balance < totalDebit) throw createError(400, "Insufficient balance");

  const receiveAmount = Math.round(sendAmount * rate * 100) / 100;
  const corridor = `${sendCurrency.substring(0, 2)}-${receiveCurrency.substring(0, 2)}`;

  const remit = await sequelize.transaction(async (t) => {
    await wallet.update({ balance: wallet.balance - totalDebit }, { transaction: t });

    return await models.remittance.create({
      userId: user.id, sendCurrency, sendAmount, receiveCurrency, receiveAmount,
      recipientName, recipientAccount, recipientBank: recipientBank || null,
      corridor, exchangeRate: rate, fee, status: "PROCESSING",
      estimatedDelivery: new Date(Date.now() + 2 * 86400000),
    }, { transaction: t });
  });

  return { message: "Remittance initiated", data: remit };
};
