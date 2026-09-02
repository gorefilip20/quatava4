import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List available loan terms",
  operationId: "listLoanTerms",
  tags: ["Finance", "Loan"],
  requiresAuth: true,
  responses: { 200: { description: "Loan terms retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  let terms = await models.loanTerm.findAll({ where: { status: true } });

  if (terms.length === 0) {
    const defaults = [
      { name: "7-Day Flash Loan", termDays: 7, interestRate: 0.5, maxLtv: 80, minCollateral: 50, status: true },
      { name: "30-Day Standard", termDays: 30, interestRate: 2.0, maxLtv: 70, minCollateral: 100, status: true },
      { name: "90-Day Extended", termDays: 90, interestRate: 5.0, maxLtv: 65, minCollateral: 200, status: true },
      { name: "180-Day Long", termDays: 180, interestRate: 8.0, maxLtv: 60, minCollateral: 500, status: true },
    ];
    await models.loanTerm.bulkCreate(defaults);
    terms = await models.loanTerm.findAll({ where: { status: true } });
  }

  return { data: terms };
};
