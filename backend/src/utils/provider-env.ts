/**
 * Provider environment compatibility helpers.
 *
 * Hostinger's deployment guide uses generic provider names while the existing
 * application used legacy names. Keep the legacy names working, but prefer the
 * names documented for new deployments.
 */
export function getSumsubAppToken(): string | undefined {
  return process.env.SUMSUB_PUBLIC_KEY || process.env.SUMSUB_API_KEY;
}

export function getSumsubPrivateKey(): string | undefined {
  return process.env.SUMSUB_PRIVATE_KEY || process.env.SUMSUB_API_SECRET;
}

export function getOpenExchangeRatesKey(): string | undefined {
  return process.env.APP_OPENEXCHANGERATES_API_KEY || process.env.APP_OPENEXCHANGERATES_APP_ID;
}
