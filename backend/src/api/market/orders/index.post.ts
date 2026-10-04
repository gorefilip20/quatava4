import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { getWallet, recordActivity } from "@b/api/finance/phase2-utils";
export const metadata: OperationObject = { summary: "Purchase a digital marketplace product", operationId: "checkoutMarketProduct", tags: ["Market"], requiresAuth: true, responses: { 200: { description: "Success" } } };
export default async (data: Handler) => {
  if (!data.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" });
  const product = await models.marketProduct.findOne({ where: { id: data.body?.productId, status: true } }); const quantity = Math.max(1, Number(data.body?.quantity || 1));
  if (!product || !Number.isInteger(quantity)) throw createError({ statusCode: 400, message: "Valid product and quantity are required" });
  const total = Number(product.price) * quantity; const tx = await models.wallet.sequelize!.transaction();
  try { const wallet = await getWallet(data.user.id, "FIAT", String(product.currency).toUpperCase(), tx); if (Number(wallet.balance) < total) throw createError({ statusCode: 400, message: "Insufficient wallet balance" }); await wallet.decrement("balance", { by: total, transaction: tx }); const order = await models.marketOrder.create({ userId: data.user.id, productId: product.id, quantity, total, currency: product.currency, status: "COMPLETED", fulfillmentData: { mode: "mock", delivery: "instant", reference: `fulfillment_${orderSafeId()}` } }, { transaction: tx }); await models.transaction.create({ userId: data.user.id, walletId: wallet.id, type: "PAYMENT", status: "COMPLETED", amount: total, fee: 0, description: `Market purchase: ${product.name}`, metadata: { orderId: order.id, productId: product.id } }, { transaction: tx }); await tx.commit(); await recordActivity(data.user.id, "MARKET_CHECKOUT", "MARKET", { orderId: order.id, productId: product.id, total }, data); return { message: "Order completed", order }; } catch (error) { await tx.rollback(); throw error; }
};
function orderSafeId() { return Math.random().toString(36).slice(2, 12); }
