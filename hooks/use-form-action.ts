"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import type { z } from "zod"

import type { ActionResult } from "@/lib/types"
import { fieldErrorsFrom } from "@/lib/validation"

export type FieldErrors = Record<string, string | undefined>

/**
 * Runs a Server Action from a form: validates first, surfaces field errors
 * returned by the server, and falls back to a toast for anything unexpected.
 */
export function useFormAction() {
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<FieldErrors>({})

  function submit<S extends z.ZodType, T>(
    schema: S,
    values: unknown,
    action: (data: z.output<S>) => Promise<ActionResult<T>>,
    onSuccess: (data: T) => void,
    extraErrors: FieldErrors = {}
  ) {
    const parsed = schema.safeParse(values)
    const clientErrors = {
      ...(parsed.success ? {} : fieldErrorsFrom(parsed.error)),
      ...extraErrors,
    }
    if (!parsed.success || Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      // Wait for the error state to render, then bring the first problem into view.
      setTimeout(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      }, 0)
      return
    }
    setErrors({})

    startTransition(async () => {
      try {
        const result = await action(parsed.data)
        if (result.ok) {
          onSuccess(result.data)
        } else {
          setErrors(result.fieldErrors ?? {})
          toast.error(result.error)
        }
      } catch {
        toast.error(
          "Something went wrong. Check your connection and try again."
        )
      }
    })
  }

  function clearError(field: string) {
    setErrors((current) =>
      current[field] === undefined
        ? current
        : { ...current, [field]: undefined }
    )
  }

  return { pending, errors, submit, clearError }
}
