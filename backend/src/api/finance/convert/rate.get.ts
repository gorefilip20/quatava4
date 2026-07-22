import { createError } from "@b/utils/error";
import {
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import {
  getFiatPriceInUSD,
  getSpotPriceInUSD,
  getEcoPriceInUSD,
} from "../currency/utils";
import { CacheManager } from "@b/utils/cache";

export const metadata: OperationObject = {
  summary: "Get conversion rate quote",
  description:
    "Returns the live conversion rate between two currencies including fee calculation, so the user can preview before confirming.",
  operationId: "getConversionRate",
  tags: ["Finance", "Convert"],
  requiresAuth: true,
  parameters: [
    {
      name: "fromCurrency",
      in: "query",
      required: true,
      schema: { type: "string" },
      description: "Source currency code",
    },
    {
      name: "fromType",
      in: "query",
      required: true,
      schema: { type: "string", enum: ["FIAT", "SPOT"] },
      description: "Source wallet type",
    },
    {
      name: "toCurrency",
      in: "query",
      required: true,
      schema: { type: "string" },
      description: "Target currency code",
    },
    {
      name: "toType",
      in: "query",
      required: true,
      schema: { type: "string", enum: ["FIAT", "SPOT"] },
      description: "Target wallet type",
    },
    {
      name: "amount",
      in: "query",
      required: false,
      schema: { type: "number" },
      description: "Amount to convert (for fee/total calculation)",
    },
  ],
  responses: {
    200: {
      description: "Rate quote returned",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              rate: { type: "number", description: "Exchange rate (1 from = X to)" },
              fromPriceUSD: { type: "number" },
              toPriceUSD: { type: "number" },
              feePercentage: { type: "number" },
              fee: { type: "number" },
              estimatedReceive: { type: "number" },
            },
          },
        },
      },
    },
    400: { description: "Invalid parameters" },
    401: unauthorizedResponse,
    500: serverErrorResponse,
  },
};

export default async (data: Handler) => {
  const { user, query } = data;

  if (!user?.id)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const { fromCurrency, fromType, toCurrency, toType, amount } = query;

  if (!fromCurrency || !fromType || !toCurrency || !toType) {
    throw createError({
      statusCode: 400,
      message: "Missing required parameters: fromCurrency, fromType, toCurrency, toType",
    });
  }

  const validTypes = ["FIAT", "SPOT"];
  if (!validTypes.includes(fromType) || !validTypes.includes(toType)) {
    throw createError({
      statusCode: 400,
      message: "Conversion only supports FIAT and SPOT wallet types",
    });
  }

  let fromPriceUSD: number;
  let toPriceUSD: number;

  try {
    fromPriceUSD = await getPriceForType(fromCurrency, fromType);
    toPriceUSD = await getPriceForType(toCurrency, toType);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 400,
      message: `Unable to fetch prices: ${error.message}`,
    });
  }

  if (!fromPriceUSD || fromPriceUSD <= 0) {
    throw createError({
      statusCode: 400,
      message: `Price not available for ${fromCurrency}`,
    });
  }
  if (!toPriceUSD || toPriceUSD <= 0) {
    throw createError({
      statusCode: 400,
      message: `Price not available for ${toCurrency}`,
    });
  }

  const rate = fromPriceUSD / toPriceUSD;

  const cacheManager = CacheManager.getInstance();
  const settings = await cacheManager.getSettings();
  const feePercentage = parseFloat(
    settings.get("convertFeePercentage") ||
    settings.get("walletTransferFeePercentage") ||
    "0"
  );

  let fee = 0;
  let estimatedReceive = 0;

  if (amount) {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      fee = (parsedAmount * feePercentage) / 100;
      const amountAfterFee = parsedAmount - fee;
      estimatedReceive = amountAfterFee * rate;
    }
  }

  return {
    rate,
    fromPriceUSD,
    toPriceUSD,
    feePercentage,
    fee,
    estimatedReceive,
  };
};

async function getPriceForType(
  currency: string,
  walletType: string
): Promise<number> {
  switch (walletType) {
    case "FIAT":
      return await getFiatPriceInUSD(currency);
    case "SPOT":
      return await getSpotPriceInUSD(currency);
    case "ECO":
    case "FUTURES":
      return await getEcoPriceInUSD(currency);
    default:
      throw createError(400, `Invalid wallet type: ${walletType}`);
  }
}
