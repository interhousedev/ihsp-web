"use client"

import { parseAsInteger, parseAsString, useQueryStates, type UseQueryStatesKeysMap } from "nuqs"
import { useCallback, useMemo } from "react"

export type FilterValues<K extends string> = Record<K, string | null>

/**
 * String filters of a list kept in the URL (`?query=ab&group_id=…`, nuqs), so a filtered list can be bookmarked and
 * survives a reload. Changing a filter goes back to the first page. Dates are `YYYY-MM-DD`, booleans `"true"`.
 */
export function useFilterState<K extends string>(keys: readonly K[]) {
  const parsers = useMemo(() => {
    const map: Record<string, typeof parseAsString | typeof parseAsInteger> = { page: parseAsInteger }
    for (const key of keys) map[key] = parseAsString
    return map as unknown as UseQueryStatesKeysMap
  }, [keys])
  const [state, setState] = useQueryStates(parsers, { history: "replace", clearOnDefault: true })

  const values = useMemo(() => {
    const result = {} as FilterValues<K>
    for (const key of keys) {
      const value = (state as Record<string, unknown>)[key]
      result[key] = typeof value === "string" && value !== "" ? value : null
    }
    return result
  }, [state, keys])

  const set = useCallback(
    (key: K, value: string | null) => {
      void setState({ [key]: value === "" ? null : value, page: null })
    },
    [setState],
  )

  const reset = useCallback(() => {
    const cleared: Record<string, null> = { page: null }
    for (const key of keys) cleared[key] = null
    void setState(cleared)
  }, [keys, setState])

  const active = keys.some((key) => values[key] !== null)
  return { values, set, reset, active }
}
