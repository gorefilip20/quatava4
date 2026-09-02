export const metadata: OperationObject = {
  summary: "Get LATAM inflation data",
  operationId: "getInflationData",
  tags: ["Finance", "Inflation"],
  requiresAuth: false,
  responses: { 200: { description: "Inflation data" } },
};

export default async () => {
  return {
    data: {
      countries: [
        { code: "AR", name: "Argentina", rate: 211.4, currency: "ARS", trend: "rising", yearOverYear: [25.5, 36.1, 50.9, 94.8, 142.7, 211.4] },
        { code: "VE", name: "Venezuela", rate: 360.0, currency: "VES", trend: "declining", yearOverYear: [2959, 3000, 686.4, 234, 305, 360] },
        { code: "BR", name: "Brazil", rate: 4.62, currency: "BRL", trend: "stable", yearOverYear: [3.75, 4.52, 10.06, 5.79, 4.62, 4.62] },
        { code: "CL", name: "Chile", rate: 7.6, currency: "CLP", trend: "declining", yearOverYear: [3.0, 4.5, 12.8, 7.6, 3.9, 7.6] },
        { code: "CO", name: "Colombia", rate: 9.28, currency: "COP", trend: "declining", yearOverYear: [1.61, 3.51, 13.12, 9.28, 7.2, 9.28] },
        { code: "MX", name: "Mexico", rate: 4.66, currency: "MXN", trend: "stable", yearOverYear: [3.15, 3.36, 7.82, 4.66, 4.2, 4.66] },
        { code: "PE", name: "Peru", rate: 3.0, currency: "PEN", trend: "stable", yearOverYear: [1.78, 1.97, 8.46, 3.0, 2.8, 3.0] },
        { code: "UY", name: "Uruguay", rate: 5.1, currency: "UYU", trend: "stable", yearOverYear: [8.79, 7.75, 9.95, 5.1, 4.8, 5.1] },
      ],
      btcPerformance: { ytd: 62.5, oneYear: 145.2, threeYear: 210.8 },
      usdtStability: { peg: 1.0, deviation30d: 0.002 },
      lastUpdated: new Date().toISOString(),
    },
  };
};
