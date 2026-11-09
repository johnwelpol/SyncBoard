import { describe, expect, it } from "vitest";
import { idSchema, nameSchema, slugSchema } from "./validation";

describe("validation schemas", () => {
  it("nameSchema trims and bounds", () => {
    expect(nameSchema.parse("  Board  ")).toBe("Board");
    expect(nameSchema.safeParse("   ").success).toBe(false);
    expect(nameSchema.safeParse("x".repeat(101)).success).toBe(false);
  });

  it("slugSchema accepts kebab-case only", () => {
    expect(slugSchema.safeParse("acme-team").success).toBe(true);
    for (const bad of ["Acme", "a", "acme--team", "-acme", "acme_team"]) {
      expect(slugSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("idSchema rejects empty", () => {
    expect(idSchema.safeParse("").success).toBe(false);
    expect(idSchema.safeParse("ckx1").success).toBe(true);
  });
});
