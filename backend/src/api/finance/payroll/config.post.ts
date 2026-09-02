import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Create or update payroll config",
  operationId: "upsertPayrollConfig",
  tags: ["Finance", "Payroll"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            companyName: { type: "string" },
            payFrequency: { type: "string", enum: ["WEEKLY", "BIWEEKLY", "MONTHLY"] },
            depositCurrency: { type: "string" },
            splitPercentage: { type: "number" },
          },
          required: ["companyName", "payFrequency"],
        },
      },
    },
  },
  responses: { 200: { description: "Config saved" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { companyName, payFrequency, depositCurrency = "USDT", splitPercentage = 100 } = body;
  if (!companyName || !payFrequency) throw createError(400, "Missing required fields");
  if (splitPercentage < 1 || splitPercentage > 100) throw createError(400, "Split must be 1-100%");

  const existing = await models.payrollConfig.findOne({ where: { userId: user.id } });

  if (existing) {
    await existing.update({ companyName, payFrequency, depositCurrency, splitPercentage });
    return { message: "Payroll config updated", data: existing };
  }

  const config = await models.payrollConfig.create({
    userId: user.id, companyName, payFrequency, depositCurrency, splitPercentage, status: "ACTIVE",
  });

  return { message: "Payroll config created", data: config };
};
