import { createQuote, getSettlementProvider } from "@b/utils/remittance";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Create a short-lived LATAM remittance quote",
  operationId: "createRemittanceQuote",
  tags: ["Remittance"],
  requiresAuth: false,
  parameters: [
    { name: "corridor", in: "query", required: true, schema: { type: "string" }, description: "Supported corridor, such as AR-CO" },
    { name: "amount", in: "query", required: true, schema: { type: "number" }, description: "Amount in the source currency" },
  ],
  responses: {
    200: { description: "Locked remittance quote" },
    400: { description: "Invalid corridor or amount" },
  },
};

export default async (data: Handler) => {
  const corridor = data.query?.corridor;
  const amount = Number(data.query?.amount);
  if (!corridor || !Number.isFinite(amount)) throw createError(400, "corridor and a numeric amount are required");
  try {
    return { status: true, data: createQuote({ corridor, amount }), provider: getSettlementProvider() };
  } catch (error: any) {
    throw createError(400, error.message);
  }
};
