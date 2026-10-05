import { createError } from "@b/utils/error";
import { models } from "@b/db";
import { getWallet, recordActivity } from "@b/api/finance/phase2-utils";
import { calculateFee, feeDisclosure } from "@b/utils/monetization";
export const metadata: OperationObject = { summary: "Buy crypto from a fiat wallet", operationId: "buyCrypto", tags: ["Finance", "Wallet"], requiresAuth: true, requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["fiatCurrency", "cryptoCurrency", "fiatAmount", "rate"], properties: { fiatCurrency: { type: "string" }, cryptoCurrency: { type: "string" }, fiatAmount: { type: "number",  }, rate: { type: "number",  } } } } } }, responses: { 200: { description: "Crypto purchased" } } };
export default async (data: Handler) => {
  if (!data.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" });
  const idempotencyKey = data.headers?.["idempotency-key"] || data.headers?.["Idempotency-Key"];
  if (!idempotencyKey || String(idempotencyKey).length < 8 || String(idempotencyKey).length > 128) throw createError({ statusCode: 400, message: "A valid Idempotency-Key header is required" });
  const fiatCurrency = String(data.body?.fiatCurrency || "USD").toUpperCase();
  const cryptoCurrency = String(data.body?.cryptoCurrency || "USDT").toUpperCase();
  const fiatAmount = Number(data.body?.fiatAmount);
  const rate = Number(data.body?.rate);
  if (!Number.isFinite(fiatAmount) || fiatAmount <= 0 || !Number.isFinite(rate) || rate <= 0) throw createError({ statusCode: 400, message: "A positive fiat amount and market rate are required" });
  const fee = calculateFee(fiatAmount, "CONVERSION");
  const totalDebit = fiatAmount + fee;
  const referenceId = `buy_crypto:${String(idempotencyKey)}`;
  const existing = await models.transaction.findOne({ where: { userId: data.user.id, referenceId } });
  if (existing) return { message: "Crypto purchase already processed", cryptoAmount: existing.amount, cryptoCurrency, fiatAmount, fiatCurrency, fee: existing.fee || fee, totalDebit, transactionId: existing.id, idempotent: true };
  const transaction = await models.wallet.sequelize!.transaction();
  try {
    const source = await getWallet(data.user.id, "FIAT", fiatCurrency, transaction);
    let destination = await models.wallet.findOne({ where: { userId: data.user.id, type: "SPOT", currency: cryptoCurrency }, transaction, lock: transaction.LOCK.UPDATE });
    if (!destination) destination = await models.wallet.create({ userId: data.user.id, type: "SPOT", currency: cryptoCurrency, balance: 0, status: true }, { transaction });
    if (Number(source.balance) < totalDebit) throw createError({ statusCode: 400, message: "Insufficient fiat wallet balance for purchase and fee" });
    const cryptoAmount = fiatAmount / rate;
    await source.decrement("balance", { by: totalDebit, transaction });
    await destination.increment("balance", { by: cryptoAmount, transaction });
    const ledger = await models.transaction.create({ userId: data.user.id, walletId: destination.id, type: "EXCHANGE_ORDER", status: "COMPLETED", amount: cryptoAmount, fee, referenceId, description: `Bought ${cryptoAmount} ${cryptoCurrency} with ${fiatAmount} ${fiatCurrency}`, metadata: { fiatCurrency, fiatAmount, totalDebit, cryptoCurrency, rate, fee: feeDisclosure("CONVERSION", fee), idempotencyKey: String(idempotencyKey) } }, { transaction });
    await transaction.commit();
    await recordActivity(data.user.id, "CRYPTO_PURCHASE", "WALLET", { fiatCurrency, fiatAmount, cryptoCurrency, cryptoAmount, rate }, data);
    return { message: "Crypto purchased successfully", cryptoAmount, cryptoCurrency, fiatAmount, fiatCurrency, rate, fee, totalDebit, transactionId: ledger.id };
  } catch (error) { await transaction.rollback(); throw error; }
};
