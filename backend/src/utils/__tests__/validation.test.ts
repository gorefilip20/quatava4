import {
  sanitizeUserPath,
  validatePathSecurity,
  validateUploadFilePath,
} from "@b/utils/validation";

describe("sanitizeUserPath", () => {
  // Real call sites (backend/src/api/upload/*.ts) only ever pass a bare
  // directory segment, never a filename with an extension: the "safe
  // characters" check has no allowance for "." and rejects anything with one.
  it("passes through a plain safe directory segment", () => {
    expect(sanitizeUserPath("avatars")).toBe("avatars");
  });

  it("strips parent-directory traversal segments", () => {
    expect(sanitizeUserPath("../../avatars")).toBe("avatars");
  });

  // NOTE: this documents existing behavior, not a spec. The dangerousPatterns
  // list includes /\/+/g ("one or more slashes") where "multiple consecutive
  // slashes" was intended (e.g. /\/{2,}/g) — as written it strips *every*
  // slash, including single ones separating segments. That means a
  // multi-segment input like "etc/passwd" is flattened to "etcpasswd" before
  // the blockedPaths check ever runs, so that check only ever matches an
  // input that is *exactly* one of the blocked names (e.g. "etc" alone), not
  // "etc" as a path segment inside a longer path. Flagged for a follow-up
  // security pass rather than changed here.
  it("blocks a bare blocked directory name", () => {
    expect(() => sanitizeUserPath("etc")).toThrow(/system directory/i);
  });

  it("rejects null bytes", () => {
    expect(() => sanitizeUserPath("file.png\0.exe")).toThrow(/null bytes/i);
  });

  it("rejects non-string input", () => {
    // @ts-expect-error intentionally invalid input
    expect(() => sanitizeUserPath(undefined)).toThrow(/invalid path/i);
  });

  it("rejects paths over the length limit", () => {
    expect(() => sanitizeUserPath("a".repeat(201))).toThrow(/too long/i);
  });
});

describe("validatePathSecurity", () => {
  it("accepts a path inside the allowed base directory", () => {
    expect(
      validatePathSecurity("/var/app/uploads/img.png", "/var/app/uploads")
    ).toBe(true);
  });

  it("rejects a path that escapes the allowed base directory", () => {
    expect(
      validatePathSecurity("/var/app/secrets/key.pem", "/var/app/uploads")
    ).toBe(false);
  });
});

describe("validateUploadFilePath", () => {
  it("rejects paths that don't start with /uploads/", () => {
    const result = validateUploadFilePath("/etc/passwd");
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/must start with \/uploads\//i);
  });

  it("rejects empty input", () => {
    // @ts-expect-error intentionally invalid input
    const result = validateUploadFilePath(undefined);
    expect(result.isValid).toBe(false);
  });
});
