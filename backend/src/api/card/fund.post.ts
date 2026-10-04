import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { getWallet, recordActivity } from "@b/api/finance/phase2-utils";
export const metadata: OperationObject = { summary: "Fund or unload virtual card", operationId: "fundVirtualCard", tags: ["Card"], requiresAuth: true, responses: { 200: { description: "Success" } } };
export default async (data: Handler) => {
  if (!data.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" });
  const amount = Number(data.body?.amount); const direction = data.body?.direction === "UNLOAD" ? "UNLOAD" : "FUND"; const sourceCurrency = String(data.body?.currency || "USD").toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0) throw createError({ statusCode: 400, message: "A positive amount is required" });
  const card = await models.virtualCard.findOne({ where: { userId: data.user.id, status: "ACTIVE" } }); if (!card) throw createError({ statusCode: 404, message: "Create an active virtual card first" });
  const tx = await models.wallet.sequelize!.transaction();
  try {
    const wallet = await getWallet(data.user.id, sourceCurrency === "USD" ? "FIAT" : "SPOT", sourceCurrency, tx);
    if (direction === "FUND") { if (Number(wallet.balance) < amount) throw createError({ statusCode: 400, message: "Insufficient wallet balance" }); await wallet.decrement("balance", { by: amount, transaction: tx }); await card.increment("balance", { by: amount, transaction: tx }); }
    else { if (Number(card.balance) < amount) throw createError({ statusCode: 400, message: "Insufficient card balance" }); await card.decrement("balance", { by: amount, transaction: tx }); await wallet.increment("balance", { by: amount, transaction: tx }); }
    await models.transaction.create({ userId: data.user.id, walletId: wallet.id, type: "PAYMENT", status: "COMPLETED", amount, fee: 0, description: `${direction === "FUND" ? "Funded" : "Unloaded"} virtual USD card`, metadata: { cardId: card.id, direction, sourceCurrency } }, { transaction: tx });
    await tx.commit(); await card.reload(); await recordActivity(data.user.id, `CARD_${direction}`, "CARD", { cardId: card.id, amount, sourceCurrency }, data); return { message: `Card ${direction === "FUND" ? "funded" : "unloaded"}`, card: card.get({ plain: true }) };
  } catch (error) { await tx.rollback(); throw error; }
};
