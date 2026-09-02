import { createError } from "@b/utils/error";

export const metadata: OperationObject = {
  summary: "Toggle inflation alerts",
  operationId: "toggleInflationAlerts",
  tags: ["Finance", "Inflation"],
  requiresAuth: true,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: { enabled: { type: "boolean" } },
          required: ["enabled"],
        },
      },
    },
  },
  responses: { 200: { description: "Alert preference updated" } },
};

export default async (data: Handler) => {
  const { user, body } = data;
  if (!user?.id) throw createError(401, "Unauthorized");

  const { enabled } = body;
  return { message: "Alert preference updated", data: { enabled: !!enabled } };
};
