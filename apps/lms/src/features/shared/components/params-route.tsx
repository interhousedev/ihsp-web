"use client"

import { useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { MissingParam } from "./missing-param"

/**
 * Reads the query parameters of an entity page (`?id=…`, static export has no dynamic segments). When a required one is
 * missing it shows a short notice instead of calling `children`. Must render inside the shell's `Suspense`.
 */
export function ParamsRoute<R extends string, O extends string = never>({
  required,
  optional,
  children,
}: {
  required: readonly R[]
  optional?: readonly O[]
  children: (params: Record<R, string> & Record<O, string | null>) => ReactNode
}) {
  const search = useSearchParams()
  const values: Record<string, string | null> = {}
  for (const name of [...required, ...(optional ?? [])]) {
    const value = search.get(name)
    values[name] = value === null || value === "" ? null : value
  }
  if (required.some((name) => values[name] === null)) return <MissingParam />
  return <>{children(values as Record<R, string> & Record<O, string | null>)}</>
}

/** A positive whole number from a query value (`?n=3`), or `null`. */
export function toPositiveInt(value: string | null): number | null {
  if (value === null) return null
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}
