import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the correct password and rejects a different one", async () => {
    const hash = await hashPassword("A-secure-password-2026");
    expect(hash).not.toContain("A-secure-password-2026");
    await expect(verifyPassword("A-secure-password-2026", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("rejects malformed or unsupported hashes", async () => {
    await expect(verifyPassword("password", "plain-text")).resolves.toBe(false);
    await expect(verifyPassword("password", "argon2$salt$hash")).resolves.toBe(false);
  });
});
