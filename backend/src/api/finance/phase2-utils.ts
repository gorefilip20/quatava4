import crypto from "crypto";
import { models } from "@b/db";
import { createError } from "@b/utils/error";

export const supportedCurrencies = ["USD", "EUR", "GBP", "LOCAL"] as const;
export type SupportedCurrency = (typeof supportedCurrencies)[number];

function stableDigits(seed: string, length: number) {
  return crypto.createHash("sha256").update(seed).digest("hex").replace(/[^0-9]/g, "").padEnd(length, "7").slice(0, length);
}
function stableHex(seed: string, length: number) { return crypto.createHash("sha256").update(seed).digest("hex").slice(0, length).toUpperCase(); }

export async function ensureVirtualAccounts(user: any) {
  const existing = await models.virtualBankAccount.findAll({ where: { userId: user.id }, order: [["currency", "ASC"]] });
  const byCurrency = new Map(existing.map((account: any) => [account.currency, account]));
  const countryCode = String(user.profile?.country || user.profile?.countryCode || "US").toUpperCase().slice(0, 2);
  const nameSeed = `${user.id}:${user.email || "user"}`;
  const definitions: Record<string, Record<string, unknown>> = {
    USD: { accountType: "CHECKING", bankName: "Quatava partner bank", routingNumber: stableDigits(`${nameSeed}:usd-routing`, 9), accountNumber: stableDigits(`${nameSeed}:usd-account`, 12) },
    EUR: { bankName: "Quatava partner bank", iban: `DE89 3704 ${stableDigits(`${nameSeed}:eur-iban`, 10)}`, bic: `QTAV${stableHex(`${nameSeed}:eur-bic`, 5)}` },
    GBP: { bankName: "Quatava partner bank", sortCode: stableDigits(`${nameSeed}:gbp-sort`, 6).replace(/(\d{2})(\d{2})(\d{2})/, "$1-$2-$3"), accountNumber: stableDigits(`${nameSeed}:gbp-account`, 8) },
    LOCAL: { bankName: `Quatava ${countryCode} local rail`, accountNumber: stableDigits(`${nameSeed}:local:${countryCode}`, 10), countryCode },
  };
  for (const currency of supportedCurrencies) {
    if (!byCurrency.has(currency)) {
      const account = await models.virtualBankAccount.create({ userId: user.id, currency, countryCode: currency === "LOCAL" ? countryCode : undefined, status: "ACTIVE", metadata: { generated: true, disclaimer: "Virtual account details are subject to KYC and partner approval." }, ...definitions[currency] });
      byCurrency.set(currency, account);
    }
  }
  return Array.from(byCurrency.values()).map((account: any) => account.get({ plain: true }));
}

export async function getWallet(userId: string, type: "FIAT" | "SPOT", currency: string, transaction?: any) {
  const wallet = await models.wallet.findOne({ where: { userId, type, currency: currency.toUpperCase() }, transaction, lock: transaction ? transaction.LOCK.UPDATE : undefined });
  if (!wallet) throw createError({ statusCode: 404, message: `${currency.toUpperCase()} ${type.toLowerCase()} wallet not found` });
  return wallet;
}

export async function recordActivity(userId: string, action: string, category: "SECURITY" | "WALLET" | "CARD" | "MARKET" | "PROFILE", data: any, request?: any) {
  if (!models.userActivityLog) return;
  await models.userActivityLog.create({ userId, action, category, metadata: data || {}, ipAddress: request?.ip, userAgent: request?.headers?.["user-agent"] });
}
