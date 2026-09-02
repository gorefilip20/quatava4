import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { Op } from "sequelize";

export const metadata: OperationObject = {
  summary: "List available savings groups",
  operationId: "listSavingsGroups",
  tags: ["Finance", "SavingsGroup"],
  requiresAuth: true,
  responses: { 200: { description: "Groups retrieved" } },
};

export default async (data: Handler) => {
  const { user } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const groups = await models.savingsGroup.findAll({
    where: { status: { [Op.in]: ["FORMING", "ACTIVE"] } },
    order: [["createdAt", "DESC"]],
  });

  return { data: groups };
};
