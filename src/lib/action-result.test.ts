import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fail, fromZodError, ok } from "./action-result";
import { nameSchema } from "./validation";

describe("ActionResult helpers", () => {
  it("ok wraps data", () => {
    expect(ok(5)).toEqual({ ok: true, data: 5 });
  });

  it("fail carries code and message", () => {
    expect(fail("FORBIDDEN", "No access")).toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "No access" },
    });
  });

  it("fromZodError maps field errors", () => {
    const r = z.object({ name: nameSchema }).safeParse({ name: "" });
    expect(fromZodError(r.error!)).toEqual({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Invalid input",
        fieldErrors: { name: [expect.any(String)] },
      },
    });
  });
});
