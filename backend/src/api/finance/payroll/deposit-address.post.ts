import { models } from "@b/db";
import { createError } from "@b/utils/error";
import crypto from "crypto";

export const metadata: OperationObject = {
  summary: "Get payroll deposit address",
  operationId: "getPayrollDepositAddress",
  tags: ["Finance", "Payroll"],
  requiresAuth: true,
  responses: { 200: { description: "Address retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const config = await models.payrollConfig.findOne({ where: { userId: user.id } });
  if (!config) throw createError(404, "Set up payroll config first");

  let wallet = await models.wallet.findOne({
    where: { userId: user.id, currency: config.depositCurrency, type: "SPOT" },
  });

  if (!wallet) {
    wallet = await models.wallet.create({
      userId: user.id, currency: config.depositCurrency, type: "SPOT", balance: 0, status: true,
    });
  }

  const address = wallet.address || `0x${crypto.randomBytes(20).toString("hex")}`;

  return { data: { address, currency: config.depositCurrency, network: "ERC-20" } };
};
