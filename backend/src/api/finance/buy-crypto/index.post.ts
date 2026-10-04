import { createError } from "@b/utils/error";
import { models } from "@b/db";
import { getWallet, recordActivity } from "@b/api/finance/phase2-utils";
export const metadata: OperationObject = { summary: "Buy crypto from a fiat wallet", operationId: "buyCrypto", tags: ["Finance", "Wallet"], requiresAuth: true, requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["fiatCurrency", "cryptoCurrency", "fiatAmount", "rate"], properties: { fiatCurrency: { type: "string" }, cryptoCurrency: { type: "string" }, fiatAmount: { type: "number",  }, rate: { type: "number",  } } } } } }, responses: { 200: { description: "Crypto purchased" } } };
export default async (data: Handler) => {
  if (!data.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" });
  const fiatCurrency = String(data.body?.fiatCurrency || "USD").toUpperCase();
  const cryptoCurrency = String(data.body?.cryptoCurrency || "USDT").toUpperCase();
  const fiatAmount = Number(data.body?.fiatAmount);
  const rate = Number(data.body?.rate);
  if (!Number.isFinite(fiatAmount) || fiatAmount <= 0 || !Number.isFinite(rate) || rate <= 0) throw createError({ statusCode: 400, message: "A positive fiat amount and market rate are required" });
  const transaction = await models.wallet.sequelize!.transaction();
  try {
    const source = await getWallet(data.user.id, "FIAT", fiatCurrency, transaction);
    let destination = await models.wallet.findOne({ where: { userId: data.user.id, type: "SPOT", currency: cryptoCurrency }, transaction, lock: transaction.LOCK.UPDATE });
    if (!destination) destination = await models.wallet.create({ userId: data.user.id, type: "SPOT", currency: cryptoCurrency, balance: 0, status: true }, { transaction });
    if (Number(source.balance) < fiatAmount) throw createError({ statusCode: 400, message: "Insufficient fiat wallet balance" });
    const cryptoAmount = fiatAmount / rate;
    await source.decrement("balance", { by: fiatAmount, transaction });
    await destination.increment("balance", { by: cryptoAmount, transaction });
    const ledger = await models.transaction.create({ userId: data.user.id, walletId: destination.id, type: "EXCHANGE_ORDER", status: "COMPLETED", amount: cryptoAmount, fee: 0, description: `Bought ${cryptoAmount} ${cryptoCurrency} with ${fiatAmount} ${fiatCurrency}`, metadata: { fiatCurrency, fiatAmount, cryptoCurrency, rate } }, { transaction });
    await transaction.commit();
    await recordActivity(data.user.id, "CRYPTO_PURCHASE", "WALLET", { fiatCurrency, fiatAmount, cryptoCurrency, cryptoAmount, rate }, data);
    return { message: "Crypto purchased successfully", cryptoAmount, cryptoCurrency, fiatAmount, fiatCurrency, rate, transactionId: ledger.id };
  } catch (error) { await transaction.rollback(); throw error; }
};
