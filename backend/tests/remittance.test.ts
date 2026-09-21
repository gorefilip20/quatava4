import crypto from "crypto";

process.env.DB_NAME = process.env.DB_NAME || "quatava_test";
process.env.DB_USER = process.env.DB_USER || "root";
process.env.DB_HOST = process.env.DB_HOST || "127.0.0.1";
process.env.DB_PORT = process.env.DB_PORT || "3306";
process.env.QUATAVA_SETTLEMENT_WEBHOOK_SECRET = "test-remittance-secret";

import { createQuote, verifyQuote, verifyWebhookSignature } from "@b/utils/remittance";

describe("LATAM remittance workflow primitives", () => {
  it("creates a transparent quote with a ten-minute expiry", () => {
    const now = new Date("2026-09-21T14:00:00.000Z");
    const quote = createQuote({ corridor: "AR-CO", amount: 50000, now });
    expect(quote.fromCurrency).toBe("ARS");
    expect(quote.toCurrency).toBe("COP");
    expect(quote.rate).toBe(2.42);
    expect(quote.fee).toBe(0);
    expect(quote.recipientAmount).toBe(121000);
    expect(quote.expiresAt).toBe("2026-09-21T14:10:00.000Z");
    expect(verifyQuote(quote.id, now).corridor).toBe("AR-CO");
  });

  it("rejects expired and tampered quotes", () => {
    const now = new Date("2026-09-21T14:00:00.000Z");
    const quote = createQuote({ corridor: "BR-AR", amount: 1000, now });
    expect(() => verifyQuote(quote.id, new Date("2026-09-21T14:11:00.000Z"))).toThrow("expired");
    expect(() => verifyQuote(`${quote.id}x`, now)).toThrow("signature");
    expect(() => createQuote({ corridor: "XX-YY", amount: 10, now })).toThrow("Unsupported");
  });

  it("verifies provider webhook signatures", () => {
    const body = JSON.stringify({ referenceId: "remit_abc12345", status: "COMPLETED" });
    const signature = crypto.createHmac("sha256", "test-remittance-secret").update(body).digest("base64url");
    expect(verifyWebhookSignature(body, signature)).toBe(true);
    expect(verifyWebhookSignature(body, `${signature}x`)).toBe(false);
  });
});
