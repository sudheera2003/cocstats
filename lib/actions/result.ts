import type { ActionResult } from "@/lib/types"

export function ok(): ActionResult
export function ok<T>(data: T): ActionResult<T>
export function ok(data?: unknown): ActionResult<unknown> {
  return { ok: true, data }
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string>
): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  return { ok: false, error, fieldErrors }
}
