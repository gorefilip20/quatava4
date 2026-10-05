export type MonetizationFeeKind = "CONVERSION" | "CARD_FUNDING" | "MARKETPLACE" | "WITHDRAWAL" | "PARTNER_MARGIN";

function rate(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export const monetization = {
  conversionFeePercent: rate("QUATAVA_CONVERSION_FEE_PERCENT", 0.75),
  cardFundingFeePercent: rate("QUATAVA_CARD_FUNDING_FEE_PERCENT", 0.5),
  marketplaceFeePercent: rate("QUATAVA_MARKETPLACE_FEE_PERCENT", 3),
  withdrawalFeePercent: rate("QUATAVA_WITHDRAWAL_FEE_PERCENT", 0.5),
  partnerMarginPercent: rate("QUATAVA_PARTNER_MARGIN_PERCENT", 10),
  premiumSubscriptionsEnabled: false,
} as const;

export function calculateFee(amount: number, kind: MonetizationFeeKind) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const percent = kind === "CONVERSION" ? monetization.conversionFeePercent : kind === "CARD_FUNDING" ? monetization.cardFundingFeePercent : kind === "MARKETPLACE" ? monetization.marketplaceFeePercent : kind === "WITHDRAWAL" ? monetization.withdrawalFeePercent : monetization.partnerMarginPercent;
  return Number((amount * percent / 100).toFixed(8));
}

export function feeDisclosure(kind: MonetizationFeeKind, fee: number) {
  return { kind, fee, ratePercent: kind === "CONVERSION" ? monetization.conversionFeePercent : kind === "CARD_FUNDING" ? monetization.cardFundingFeePercent : kind === "MARKETPLACE" ? monetization.marketplaceFeePercent : kind === "WITHDRAWAL" ? monetization.withdrawalFeePercent : monetization.partnerMarginPercent, premiumSubscriptionsEnabled: false };
}
