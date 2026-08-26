export type SandboxVerificationStatus = "VERIFIED" | "FAILED" | "PENDING";

export interface SandboxVerificationResponse {
  status: SandboxVerificationStatus;
  score: number | null;
  checks: {
    provider: "SANDBOX";
    decision: string;
    deterministic: true;
    message: string;
  };
  documentVerifications: {
    identity: "PASSED" | "FAILED" | "PENDING";
    liveness: "PASSED" | "FAILED" | "PENDING";
  };
}

export function evaluateSandboxKycDecision(data: unknown): SandboxVerificationResponse {
  let submittedData: Record<string, unknown> = {};
  if (typeof data === "string") {
    try {
      submittedData = JSON.parse(data) as Record<string, unknown>;
    } catch {
      submittedData = {};
    }
  } else if (data && typeof data === "object" && !Array.isArray(data)) {
    submittedData = data as Record<string, unknown>;
  }

  const decision = String(submittedData.sandboxDecision || "PENDING").toUpperCase();
  const status: SandboxVerificationStatus =
    decision === "PASS" ? "VERIFIED" : decision === "FAIL" ? "FAILED" : "PENDING";
  const outcome = status === "VERIFIED" ? "PASSED" : status === "FAILED" ? "FAILED" : "PENDING";

  return {
    status,
    score: status === "VERIFIED" ? 0.99 : status === "FAILED" ? 0.05 : null,
    checks: {
      provider: "SANDBOX",
      decision,
      deterministic: true,
      message: `Sandbox KYC decision: ${decision}`,
    },
    documentVerifications: {
      identity: outcome,
      liveness: outcome,
    },
  };
}

export function calculateVerifiedExchangeRate(fromPriceUSD: number, toPriceUSD: number): number {
  if (!Number.isFinite(fromPriceUSD) || fromPriceUSD <= 0) {
    throw new Error("Source currency price must be a positive finite number");
  }
  if (!Number.isFinite(toPriceUSD) || toPriceUSD <= 0) {
    throw new Error("Target currency price must be a positive finite number");
  }
  return fromPriceUSD / toPriceUSD;
}
