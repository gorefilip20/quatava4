import { models } from "@b/db";
import { createError } from "@b/utils/error";
import { recordActivity } from "@b/api/finance/phase2-utils";
export const metadata: OperationObject = { summary: "Freeze or unfreeze virtual card", operationId: "updateVirtualCardStatus", tags: ["Card"], requiresAuth: true, responses: { 200: { description: "Success" } } };
export default async (data: Handler) => { if (!data.user?.id) throw createError({ statusCode: 401, message: "Unauthorized" }); const status = data.body?.status === "FROZEN" ? "FROZEN" : "ACTIVE"; const card = await models.virtualCard.findOne({ where: { userId: data.user.id } }); if (!card) throw createError({ statusCode: 404, message: "Card not found" }); await card.update({ status }); await recordActivity(data.user.id, `CARD_${status}`, "CARD", { cardId: card.id }, data); return { message: `Card ${status.toLowerCase()}`, card: card.get({ plain: true }) }; };
