import { z } from "zod";

// Every server action returns this shape instead of throwing to the client.
export type ActionErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: ActionErrorCode;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(
  code: ActionErrorCode,
  message: string,
): ActionResult<never> {
  return { ok: false, error: { code, message } };
}

export function fromZodError(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    error: {
      code: "VALIDATION",
      message: "Invalid input",
      fieldErrors: z.flattenError(error).fieldErrors as Record<
        string,
        string[]
      >,
    },
  };
}
