import crypto from "crypto";
import { Transaction as SequelizeTransaction } from "sequelize";
import { models, sequelize } from "@b/db";

export type RemittanceCorridor = "AR-CO" | "BR-AR" | "BR-CO";
export type RemittanceStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface RemittanceQuote {
  id: string;
  corridor: RemittanceCorridor;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  fee: number;
  feePercent: number;
  amount: number;
  recipientAmount: number;
  expiresAt: string;
  provider: string;
  preview: boolean;
}

interface CorridorConfig {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  feePercent: number;
  minAmount: number;
  maxAmount: number;
}

const CORRIDORS: Record<RemittanceCorridor, CorridorConfig> = {
  "AR-CO": { fromCurrency: "ARS", toCurrency: "COP", rate: 2.42, feePercent: 0, minAmount: 1000, maxAmount: 5000000 },
  "BR-AR": { fromCurrency: "BRL", toCurrency: "ARS", rate: 5.18, feePercent: 0.18, minAmount: 20, maxAmount: 100000 },
  "BR-CO": { fromCurrency: "BRL", toCurrency: "COP", rate: 0.0081, feePercent: 0.12, minAmount: 20, maxAmount: 100000 },
};

const QUOTE_TTL_MS = 10 * 60 * 1000;
const providerName = process.env.QUATAVA_SETTLEMENT_PROVIDER || "preview";
const webhookSecret = process.env.QUATAVA_SETTLEMENT_WEBHOOK_SECRET || "";

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function parseBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return crypto.createHmac("sha256", webhookSecret || "preview-only-secret").update(value).digest("base64url");
}

function assertFinitePositive(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be a positive number`);
  return value;
}

export function getCorridorConfig(corridor: string): CorridorConfig {
  const config = CORRIDORS[corridor as RemittanceCorridor];
  if (!config) throw new Error("Unsupported settlement corridor");
  return config;
}

export function createQuote(input: { corridor: string; amount: number; now?: Date }): RemittanceQuote {
  const config = getCorridorConfig(input.corridor);
  const amount = assertFinitePositive(input.amount, "amount");
  if (amount < config.minAmount || amount > config.maxAmount) {
    throw new Error(`Amount must be between ${config.minAmount} and ${config.maxAmount} ${config.fromCurrency}`);
  }
  const fee = Number((amount * config.feePercent / 100).toFixed(2));
  const expiresAt = new Date((input.now || new Date()).getTime() + QUOTE_TTL_MS);
  const payload = {
    corridor: input.corridor,
    amount,
    rate: config.rate,
    fee,
    issuedAt: Date.now(),
    expiresAt: expiresAt.toISOString(),
  };
  const encoded = base64Url(JSON.stringify(payload));
  return {
    id: `${encoded}.${sign(encoded)}`,
    corridor: input.corridor as RemittanceCorridor,
    fromCurrency: config.fromCurrency,
    toCurrency: config.toCurrency,
    rate: config.rate,
    fee,
    feePercent: config.feePercent,
    amount,
    recipientAmount: Number(((amount - fee) * config.rate).toFixed(2)),
    expiresAt: expiresAt.toISOString(),
    provider: providerName,
    preview: providerName === "preview",
  };
}

export function verifyQuote(quoteId: string, now = new Date()): RemittanceQuote {
  const [encoded, signature] = String(quoteId || "").split(".");
  const expected = encoded ? sign(encoded) : "";
  if (!encoded || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid quote signature");
  }
  let payload: { corridor: string; amount: number; rate: number; fee: number; expiresAt: string };
  try {
    payload = JSON.parse(parseBase64Url(encoded));
  } catch {
    throw new Error("Invalid quote payload");
  }
  if (new Date(payload.expiresAt).getTime() <= now.getTime()) throw new Error("Quote has expired");
  const config = getCorridorConfig(payload.corridor);
  if (payload.rate !== config.rate || payload.fee !== Number((payload.amount * config.feePercent / 100).toFixed(2))) throw new Error("Quote is no longer valid");
  return {
    id: quoteId,
    corridor: payload.corridor as RemittanceCorridor,
    fromCurrency: config.fromCurrency,
    toCurrency: config.toCurrency,
    rate: payload.rate,
    fee: payload.fee,
    feePercent: config.feePercent,
    amount: payload.amount,
    recipientAmount: Number(((payload.amount - payload.fee) * payload.rate).toFixed(2)),
    expiresAt: payload.expiresAt,
    provider: providerName,
    preview: providerName === "preview",
  };
}

export function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  if (!webhookSecret || !signature) return false;
  const expected = sign(rawBody);
  const provided = signature.replace(/^sha256=/, "");
  return provided.length === expected.length && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export function getSettlementProvider(): "preview" | "http" {
  return providerName === "preview" ? "preview" : "http";
}

export async function dispatchRemittance(input: {
  transactionId: string;
  referenceId: string;
  quote: RemittanceQuote;
  recipient: { name: string; account: string; country: string };
}): Promise<{ providerReference?: string }> {
  if (providerName === "preview") return {};
  const endpoint = process.env.QUATAVA_SETTLEMENT_PROVIDER_URL;
  const apiKey = process.env.QUATAVA_SETTLEMENT_API_KEY;
  if (!endpoint || !apiKey) throw new Error("Settlement provider is not fully configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}`, "idempotency-key": input.referenceId },
      body: JSON.stringify({ transactionId: input.transactionId, referenceId: input.referenceId, corridor: input.quote.corridor, source: { currency: input.quote.fromCurrency, amount: input.quote.amount }, destination: { currency: input.quote.toCurrency, amount: input.quote.recipientAmount }, recipient: input.recipient }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Settlement provider rejected request (${response.status})`);
    return { providerReference: payload.providerReference || payload.id || payload.referenceId };
  } finally {
    clearTimeout(timeout);
  }
}

export async function createRemittanceIntent(input: {
  userId: string;
  quote: RemittanceQuote;
  recipient: { name: string; account: string; country: string };
  idempotencyKey: string;
}) {
  const referenceId = `remit_${input.idempotencyKey}`;
  const existing = await models.transaction.findOne({ where: { referenceId, userId: input.userId } });
  if (existing) return existing;
  const result = await sequelize.transaction(async (t: SequelizeTransaction) => {
    const wallet = await models.wallet.findOne({
      where: { userId: input.userId, type: "FIAT", currency: input.quote.fromCurrency, status: true },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!wallet) throw new Error(`No active ${input.quote.fromCurrency} wallet found`);
    const currentBalance = Number(wallet.balance || 0);
    if (currentBalance < input.quote.amount) throw new Error("Insufficient available balance");
    await wallet.update({ balance: currentBalance - input.quote.amount }, { transaction: t });
    return models.transaction.create({
      userId: input.userId,
      walletId: wallet.id,
      type: "OUTGOING_TRANSFER",
      status: "PENDING",
      amount: input.quote.amount,
      fee: input.quote.fee,
      referenceId,
      description: `LATAM remittance ${input.quote.corridor}`,
      metadata: JSON.stringify({
        workflow: "LATAM_REMITTANCE",
        corridor: input.quote.corridor,
        fromCurrency: input.quote.fromCurrency,
        toCurrency: input.quote.toCurrency,
        rate: input.quote.rate,
        recipientAmount: input.quote.recipientAmount,
        recipient: input.recipient,
        quoteId: input.quote.id,
        provider: input.quote.provider,
        preview: input.quote.preview,
        reservedAt: new Date().toISOString(),
      }),
    }, { transaction: t });
  });
  return result;
}

export async function reconcileRemittance(input: { referenceId: string; status: "COMPLETED" | "FAILED"; providerReference?: string; providerPayload?: unknown }) {
  return sequelize.transaction(async (t: SequelizeTransaction) => {
    const transaction = await models.transaction.findOne({ where: { referenceId: input.referenceId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!transaction) return null;
    if (["COMPLETED", "REFUNDED"].includes(transaction.status)) return transaction;
    if (input.status === "COMPLETED") {
      await transaction.update({ status: "COMPLETED", trxId: input.providerReference || transaction.trxId, metadata: mergeMetadata(transaction.metadata, { providerStatus: "COMPLETED", providerPayload: input.providerPayload, reconciledAt: new Date().toISOString() }) }, { transaction: t });
      return transaction;
    }
    const wallet = await models.wallet.findByPk(transaction.walletId, { transaction: t, lock: t.LOCK.UPDATE });
    if (wallet) await wallet.update({ balance: Number(wallet.balance || 0) + Number(transaction.amount) }, { transaction: t });
    await transaction.update({ status: "REFUNDED", trxId: input.providerReference || transaction.trxId, metadata: mergeMetadata(transaction.metadata, { providerStatus: "FAILED", providerPayload: input.providerPayload, refundedAt: new Date().toISOString() }) }, { transaction: t });
    return transaction;
  });
}

function mergeMetadata(value: unknown, extra: Record<string, unknown>): string {
  let current: Record<string, unknown> = {};
  try { current = typeof value === "string" ? JSON.parse(value || "{}") : (value as Record<string, unknown>) || {}; } catch { current = {}; }
  return JSON.stringify({ ...current, ...extra });
}
