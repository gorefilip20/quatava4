import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Get remittance quote",
  operationId: "getRemittanceQuote",
  tags: ["Finance", "Remittance"],
  requiresAuth: true,
  parameters: [
    { name: "sendCurrency", in: "query", schema: { type: "string" } },
    { name: "receiveCurrency", in: "query", schema: { type: "string" } },
    { name: "sendAmount", in: "query", schema: { type: "number" } },
  ],
  responses: { 200: { description: "Quote generated" } },
};

const RATES: Record<string, number> = {
  "USDT-BRL": 4.97, "USDT-ARS": 350, "USDT-CLP": 880, "USDT-COP": 3950,
  "USDT-MXN": 17.1, "USDT-PEN": 3.72, "USDT-VES": 36.5, "USDT-UYU": 39.2,
  "USDT-BOB": 6.91, "USDT-PYG": 7280, "USDT-USD": 1,
  "BTC-BRL": 310000, "BTC-ARS": 21000000, "BTC-MXN": 1060000,
  "ETH-BRL": 16500, "ETH-ARS": 1120000, "ETH-MXN": 56000,
};

export default async (data: Handler) => {
  const { user, query } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { sendCurrency, receiveCurrency, sendAmount: rawAmount } = query;
  if (!sendCurrency || !receiveCurrency || !rawAmount)
    throw createError(400, "Missing required parameters");

  const sendAmount = parseFloat(rawAmount);
  if (isNaN(sendAmount) || sendAmount <= 0) throw createError(400, "Invalid amount");

  const key = `${sendCurrency}-${receiveCurrency}`;
  const rate = RATES[key];
  if (!rate) throw createError(400, `Corridor ${key} not supported`);

  const fee = Math.max(1, sendAmount * 0.025);
  const netAmount = sendAmount - fee;
  const receiveAmount = netAmount * rate;
  const estimatedDelivery = new Date(Date.now() + 2 * 86400000);

  return {
    data: { sendAmount, sendCurrency, receiveCurrency, receiveAmount: Math.round(receiveAmount * 100) / 100, exchangeRate: rate, fee, estimatedDelivery },
  };
};
