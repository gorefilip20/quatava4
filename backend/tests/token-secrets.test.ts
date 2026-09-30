import {
  getTokenSecret,
  TOKEN_SECRET_ENV_VARS,
  validateProductionTokenSecrets,
} from "@b/utils/token-secrets";

const originalEnvironment = new Map<string, string | undefined>();

beforeAll(() => {
  for (const name of [...TOKEN_SECRET_ENV_VARS, "NODE_ENV"]) {
    originalEnvironment.set(name, process.env[name]);
  }
});

afterAll(() => {
  for (const [name, value] of originalEnvironment) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

beforeEach(() => {
  process.env.NODE_ENV = "production";
  for (const name of TOKEN_SECRET_ENV_VARS) delete process.env[name];
});

describe("production token secrets", () => {
  it("rejects missing or short production secrets and identifies the fields", () => {
    process.env.APP_ACCESS_TOKEN_SECRET = "short";

    expect(() => validateProductionTokenSecrets()).toThrow("APP_ACCESS_TOKEN_SECRET");
    expect(() => getTokenSecret("APP_ACCESS_TOKEN_SECRET")).toThrow("64 characters");
  });

  it("accepts four distinct secrets of sufficient length", () => {
    TOKEN_SECRET_ENV_VARS.forEach((name, index) => {
      process.env[name] = `${String(index).repeat(64)}`;
    });

    expect(() => validateProductionTokenSecrets()).not.toThrow();
  });

  it("rejects reuse of the same production secret across token purposes", () => {
    TOKEN_SECRET_ENV_VARS.forEach((name) => {
      process.env[name] = "a".repeat(64);
    });

    expect(() => validateProductionTokenSecrets()).toThrow("unique value");
  });

  it("keeps the development fallback outside production only", () => {
    process.env.NODE_ENV = "development";

    expect(getTokenSecret("APP_ACCESS_TOKEN_SECRET")).toBe("secret");
    expect(() => validateProductionTokenSecrets()).not.toThrow();
  });
});
