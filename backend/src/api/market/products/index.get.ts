import { models } from "@b/db";
export const metadata: OperationObject = { summary: "List Quatava digital marketplace products", operationId: "listMarketProducts", tags: ["Market"], requiresAuth: true, responses: { 200: { description: "Success" } } };
export default async () => { const products = await models.marketProduct.findAll({ where: { status: true }, order: [["category", "ASC"], ["name", "ASC"]] }); return { categories: ["GIFT_CARD", "UTILITY", "TICKET", "ESIM", "DIGITAL"], products }; };
