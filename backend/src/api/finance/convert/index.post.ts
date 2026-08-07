import { models, sequelize } from "@b/db";
import {
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import { createError } from "@b/utils/error";
import { CacheManager } from "@b/utils/cache";
import {
  getFiatPriceInUSD,
  getSpotPriceInUSD,
  getEcoPriceInUSD,
} from "../currency/utils";
import {
  calculateNewBalance,
  calculateTransferFee,
  getCurrencyData,
  recordAdminProfit,
} from "../transfer/utils";

export const metadata: OperationObject = {
  summary: "Convert between currencies",
  description:
    "Instantly convert between crypto and fiat currencies at live market rates. Supports SPOT-to-FIAT, FIAT-to-SPOT, and SPOT-to-SPOT conversions.",
  operationId: "createConversion",
  tags: ["Finance", "Convert"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            fromCurrency: {
              type: "string",
              description: "Source currency code (e.g., BTC, ETH, USD, NGN)",
            },
            fromType: {
              type: "string",
              enum: ["FIAT", "SPOT"],
              description: "Source wallet type",
            },
            toCurrency: {
              type: "string",
              description: "Target currency code",
            },
            toType: {
              type: "string",
              enum: ["FIAT", "SPOT"],
              description: "Target wallet type",
            },
            amount: {
              type: "number",
              description: "Amount of source currency to convert",
            },
          },
          required: [
            "fromCurrency",
            "fromType",
            "toCurrency",
            "toType",
            "amount",
          ],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Conversion completed successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string" },
              fromAmount: { type: "number" },
              toAmount: { type: "number" },
              rate: { type: "number" },
              fee: { type: "number" },
              fromCurrency: { type: "string" },
              toCurrency: { type: "string" },
            },
          },
        },
      },
    },
    400: {
      description: "Bad request - invalid parameters or insufficient balance",
    },
    401: unauthorizedResponse,
    404: notFoundMetadataResponse("Wallet"),
    500: serverErrorResponse,
  },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id)
    throw createError({ statusCode: 401, message: "Unauthorized" });

  const { fromCurrency, fromType, toCurrency, toType, amount } = body;

  if (!fromCurrency || !fromType || !toCurrency || !toType || !amount) {
    throw createError({
      statusCode: 400,
      message: "All fields are required: fromCurrency, fromType, toCurrency, toType, amount",
    });
  }

  if (fromCurrency === toCurrency && fromType === toType) {
    throw createError({
      statusCode: 400,
      message: "Cannot convert to the same currency and wallet type",
    });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw createError({ statusCode: 400, message: "Invalid conversion amount" });
  }

  const validTypes = ["FIAT", "SPOT"];
  if (!validTypes.includes(fromType) || !validTypes.includes(toType)) {
    throw createError({
      statusCode: 400,
      message: "Conversion only supports FIAT and SPOT wallet types",
    });
  }

  const fromWallet = await models.wallet.findOne({
    where: { userId: user.id, currency: fromCurrency, type: fromType },
  });
  if (!fromWallet)
    throw createError({ statusCode: 404, message: "Source wallet not found" });

  if (fromWallet.balance < parsedAmount) {
    throw createError({ statusCode: 400, message: "Insufficient balance" });
  }

  const cacheManager = CacheManager.getInstance();
  const settings = await cacheManager.getSettings();
  const conversionFeePercentage =
    settings.get("convertFeePercentage") ||
    settings.get("walletTransferFeePercentage") ||
    0;

  const fee = calculateTransferFee(parsedAmount, conversionFeePercentage);
  const amountAfterFee = parsedAmount - fee;

  let rate = 1;
  let convertedAmount = amountAfterFee;

  if (fromCurrency !== toCurrency) {
    const fromPriceUSD = await getPriceInUSD(fromCurrency, fromType);
    const toPriceUSD = await getPriceInUSD(toCurrency, toType);

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

    rate = fromPriceUSD / toPriceUSD;
    convertedAmount = amountAfterFee * rate;
  }

  const currencyData = await getCurrencyData(fromType, fromCurrency);
  const precision = currencyData?.precision || 8;

  const result = await sequelize.transaction(async (t) => {
    let toWallet = await models.wallet.findOne({
      where: { userId: user.id, currency: toCurrency, type: toType },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!toWallet) {
      toWallet = await models.wallet.create(
        {
          userId: user.id,
          currency: toCurrency,
          type: toType,
          balance: 0,
          status: true,
        },
        { transaction: t }
      );
    }

    const lockedFromWallet = await models.wallet.findOne({
      where: { id: fromWallet.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!lockedFromWallet || lockedFromWallet.balance < parsedAmount) {
      throw createError({ statusCode: 400, message: "Insufficient balance" });
    }

    const newFromBalance = calculateNewBalance(
      lockedFromWallet.balance,
      -parsedAmount,
      precision
    );
    const newToBalance = calculateNewBalance(
      toWallet.balance,
      convertedAmount,
      precision
    );

    await lockedFromWallet.update(
      { balance: newFromBalance },
      { transaction: t }
    );
    await toWallet.update({ balance: newToBalance }, { transaction: t });

    const outgoingTx = await models.transaction.create(
      {
        userId: user.id,
        walletId: lockedFromWallet.id,
        type: "OUTGOING_TRANSFER",
        amount: parsedAmount,
        fee,
        status: "COMPLETED",
        description: `Convert ${parsedAmount} ${fromCurrency} to ${toCurrency}`,
        metadata: JSON.stringify({
          action: "CONVERT",
          fromWallet: lockedFromWallet.id,
          toWallet: toWallet.id,
          fromCurrency,
          toCurrency,
          fromType,
          toType,
          rate,
          convertedAmount,
        }),
      },
      { transaction: t }
    );

    await models.transaction.create(
      {
        userId: user.id,
        walletId: toWallet.id,
        type: "INCOMING_TRANSFER",
        amount: convertedAmount,
        fee: 0,
        status: "COMPLETED",
        description: `Received ${convertedAmount.toFixed(precision)} ${toCurrency} from conversion`,
        metadata: JSON.stringify({
          action: "CONVERT",
          fromWallet: lockedFromWallet.id,
          toWallet: toWallet.id,
          fromCurrency,
          toCurrency,
          fromType,
          toType,
          rate,
          sourceAmount: parsedAmount,
        }),
      },
      { transaction: t }
    );

    if (fee > 0) {
      await recordAdminProfit({
        userId: user.id,
        transferFeeAmount: fee,
        fromCurrency,
        fromType,
        toType,
        transactionId: outgoingTx.id,
        t,
      });
    }

    return {
      fromBalance: newFromBalance,
      toBalance: newToBalance,
    };
  });

  return {
    message: "Conversion completed successfully",
    fromAmount: parsedAmount,
    toAmount: parseFloat(convertedAmount.toFixed(precision)),
    rate,
    fee,
    fromCurrency,
    toCurrency,
    fromType,
    toType,
    fromBalance: result.fromBalance,
    toBalance: result.toBalance,
  };
};

async function getPriceInUSD(
  currency: string,
  walletType: string
): Promise<number> {
  try {
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
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError(
      400,
      `Unable to fetch price for ${currency}: ${error.message}`
    );
  }
}
