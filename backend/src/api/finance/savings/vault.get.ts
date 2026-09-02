import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List available savings vaults",
  operationId: "listSavingsVaults",
  tags: ["Finance", "Savings"],
  requiresAuth: true,
  responses: { 200: { description: "Vaults retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  let vaults = await models.savingsVault.findAll({ where: { status: true } });

  if (vaults.length === 0) {
    const defaults = [
      { name: "USDT Flex", currency: "USDT", apy: 5.2, minDeposit: 10, maxDeposit: 100000, lockDays: 0 },
      { name: "USDT 30-Day", currency: "USDT", apy: 8.5, minDeposit: 50, maxDeposit: 100000, lockDays: 30 },
      { name: "USDT 90-Day", currency: "USDT", apy: 12.0, minDeposit: 100, maxDeposit: 100000, lockDays: 90 },
      { name: "BTC Earn", currency: "BTC", apy: 3.5, minDeposit: 0.001, maxDeposit: 10, lockDays: 30 },
      { name: "ETH Earn", currency: "ETH", apy: 4.2, minDeposit: 0.01, maxDeposit: 100, lockDays: 30 },
    ];
    await models.savingsVault.bulkCreate(defaults);
    vaults = await models.savingsVault.findAll({ where: { status: true } });
  }

  return { data: vaults };
};
