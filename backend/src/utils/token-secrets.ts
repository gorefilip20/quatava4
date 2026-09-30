export const TOKEN_SECRET_ENV_VARS = [
  "APP_ACCESS_TOKEN_SECRET",
  "APP_REFRESH_TOKEN_SECRET",
  "APP_RESET_TOKEN_SECRET",
  "APP_VERIFY_TOKEN_SECRET",
] as const;

export type TokenSecretEnvVar = (typeof TOKEN_SECRET_ENV_VARS)[number];

const MIN_PRODUCTION_SECRET_LENGTH = 64;

export function getTokenSecret(name: TokenSecretEnvVar): string {
  const secret = process.env[name]?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.length < MIN_PRODUCTION_SECRET_LENGTH) {
      throw new Error(
        `Production requires ${name} to contain at least ${MIN_PRODUCTION_SECRET_LENGTH} characters.`,
      );
    }
    return secret;
  }

  // Retain the legacy development-only fallback; production never accepts it.
  return secret || "secret";
}

export function validateProductionTokenSecrets(): void {
  if (process.env.NODE_ENV !== "production") return;

  const values = TOKEN_SECRET_ENV_VARS.map((name) => [name, process.env[name]?.trim() || ""] as const);
  const invalid = values
    .filter(([, value]) => value.length < MIN_PRODUCTION_SECRET_LENGTH)
    .map(([name]) => name);
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const [name, value] of values) {
    if (!value || value.length < MIN_PRODUCTION_SECRET_LENGTH) continue;
    if (seen.has(value)) duplicates.push(name);
    seen.add(value);
  }

  if (invalid.length > 0 || duplicates.length > 0) {
    const names = [...new Set([...invalid, ...duplicates])];
    throw new Error(
      `Invalid production token secret configuration for: ${names.join(", ")}. Set each JWT secret to a unique value at least ${MIN_PRODUCTION_SECRET_LENGTH} characters long.`,
    );
  }
}
