import {
  calculateVerifiedExchangeRate,
  evaluateSandboxKycDecision,
} from "@b/utils/sandbox";

describe("sandbox finance acceptance primitives", () => {
  it("maps PASS to an approved verification result", () => {
    const result = evaluateSandboxKycDecision({ sandboxDecision: "PASS" });

    expect(result.status).toBe("VERIFIED");
    expect(result.score).toBe(0.99);
    expect(result.documentVerifications.identity).toBe("PASSED");
    expect(result.checks.deterministic).toBe(true);
  });

  it("maps FAIL and PENDING deterministically", () => {
    expect(evaluateSandboxKycDecision({ sandboxDecision: "FAIL" }).status).toBe("FAILED");
    expect(evaluateSandboxKycDecision({ sandboxDecision: "PENDING" }).status).toBe("PENDING");
    expect(evaluateSandboxKycDecision({ sandboxDecision: "unknown" }).status).toBe("PENDING");
    expect(evaluateSandboxKycDecision(JSON.stringify({ sandboxDecision: "PASS" })).status).toBe("VERIFIED");
  });

  it("calculates a positive supported-currency rate", () => {
    expect(calculateVerifiedExchangeRate(1.08, 1)).toBeCloseTo(1.08);
  });

  it("rejects missing, zero, negative, and non-finite prices", () => {
    expect(() => calculateVerifiedExchangeRate(0, 1)).toThrow();
    expect(() => calculateVerifiedExchangeRate(1, 0)).toThrow();
    expect(() => calculateVerifiedExchangeRate(-1, 1)).toThrow();
    expect(() => calculateVerifiedExchangeRate(Number.NaN, 1)).toThrow();
    expect(() => calculateVerifiedExchangeRate(1, Number.POSITIVE_INFINITY)).toThrow();
  });
});
