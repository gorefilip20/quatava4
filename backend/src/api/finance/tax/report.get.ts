import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List generated tax reports",
  operationId: "listTaxReports",
  tags: ["Finance", "Tax"],
  requiresAuth: true,
  responses: { 200: { description: "Reports retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const reports = await models.taxReport.findAll({
    where: { userId: user.id },
    order: [["year", "DESC"]],
  });

  return { data: reports };
};
