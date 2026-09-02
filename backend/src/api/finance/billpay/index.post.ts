import { models, sequelize } from "@b/db";
import { createError } from "@b/utils/error";
import crypto from "crypto";

export const metadata: OperationObject = {
  summary: "Pay a bill",
  operationId: "payBill",
  tags: ["Finance", "BillPay"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            categoryId: { type: "string" },
            billerName: { type: "string" },
            accountNumber: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string" },
            country: { type: "string" },
          },
          required: ["categoryId", "billerName", "accountNumber", "amount", "currency", "country"],
        },
      },
    },
  },
  responses: { 200: { description: "Bill paid" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { categoryId, billerName, accountNumber, amount, currency, country } = body;
  if (!categoryId || !billerName || !accountNumber || !amount || !currency || !country)
    throw createError(400, "Missing required fields");
  if (amount <= 0) throw createError(400, "Invalid amount");

  const category = await models.billCategory.findByPk(categoryId);
  if (!category) throw createError(404, "Category not found");

  const wallet = await models.wallet.findOne({
    where: { userId: user.id, currency, type: "SPOT" },
  });
  if (!wallet) throw createError(404, "Wallet not found");
  if (wallet.balance < amount) throw createError(400, "Insufficient balance");

  const reference = `BP-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const payment = await sequelize.transaction(async (t) => {
    await wallet.update({ balance: wallet.balance - amount }, { transaction: t });

    return await models.billPayment.create({
      userId: user.id, categoryId, billerName, accountNumber,
      amount, currency, country, status: "COMPLETED",
      reference, paidAt: new Date(),
    }, { transaction: t });
  });

  return { message: "Bill paid successfully", data: payment };
};
