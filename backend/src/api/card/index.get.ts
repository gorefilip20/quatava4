import { models } from "@b/db";
import { createError } from "@b/utils/error";
export const metadata: OperationObject = { summary: "Get virtual USD card", operationId: "getVirtualCard", tags: ["Card"], requiresAuth: true, responses: { 200: { description: "Success" } } };
export default async (data: Handler) => { if (!data.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" }); const card = await models.virtualCard.findOne({ where: { userId: data.user.id } }); return { card: card?.get({ plain: true }) || null }; };
