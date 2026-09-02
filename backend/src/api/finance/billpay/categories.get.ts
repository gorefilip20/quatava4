import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "List bill categories",
  operationId: "listBillCategories",
  tags: ["Finance", "BillPay"],
  requiresAuth: true,
  parameters: [{ name: "country", in: "query", schema: { type: "string" } }],
  responses: { 200: { description: "Categories retrieved" } },
};

const DEFAULT_CATEGORIES = [
  { name: "Electricity", icon: "zap" },
  { name: "Water", icon: "droplets" },
  { name: "Internet", icon: "wifi" },
  { name: "Phone", icon: "phone" },
  { name: "Gas", icon: "flame" },
  { name: "TV/Cable", icon: "tv" },
];
const COUNTRIES = ["BR", "AR", "MX", "CO", "CL", "PE"];

export default async (data: Handler) => {
  const { user, query } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const where: any = { status: true };
  if (query?.country) where.country = query.country;

  let categories = await models.billCategory.findAll({ where });

  if (categories.length === 0) {
    const seeds: any[] = [];
    for (const country of COUNTRIES) {
      for (const cat of DEFAULT_CATEGORIES) {
        seeds.push({ ...cat, country, status: true });
      }
    }
    await models.billCategory.bulkCreate(seeds);
    categories = await models.billCategory.findAll({ where });
  }

  return { data: categories };
};
