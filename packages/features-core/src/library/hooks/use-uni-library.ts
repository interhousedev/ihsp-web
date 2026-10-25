"use client"

import { getUniLibraryTaxonomiesQuery, isApiError, type ItemKind } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { useLibraryAccess } from "./use-library-access"

export type UniLibraryAvailability = "loading" | "enabled" | "disabled"

/**
 * UniLibrary is a dormant, flag-controlled source (`LIBRARY__UNILIBRARY_ENABLED`, off by default): when the API says
 * it is off, **nothing** from UniLibrary may show: no source chip, no "More from UniLibrary" block, no cards, no filter
 * option. The API says so with `404 library/external-disabled` on every `/library/external/unilibrary/*` route, except
 * the taxonomies, which answer `200 {enabled: false}`; the cached taxonomies request is the cheapest probe. While the answer is not known the state is `loading`, which the UI
 * treats like `disabled` (no flash of UniLibrary parts). A `503 library/external-unavailable` means "on, but the
 * service is down", so the source stays visible and its blocks show their own saved-results or error state.
 */
export function useUniLibraryAvailability(): UniLibraryAvailability {
  const { status, signedIn } = useLibraryAccess()
  const query = useQuery({
    ...getUniLibraryTaxonomiesQuery(),
    // After the session restore, so the probe carries the token when there is one.
    enabled: signedIn,
    retry: false,
    staleTime: 5 * 60_000,
  })
  // The route needs a login (a visitor would only get 401), so a visitor never sees UniLibrary parts.
  if (status === "anonymous") return "disabled"
  // A switched-off UniLibrary answers 200 with `enabled: false` (no 404 in the console).
  if (query.isSuccess) return query.data.enabled ? "enabled" : "disabled"
  if (query.isError) {
    return isApiError(query.error) && query.error.type === "library/external-unavailable" ? "enabled" : "disabled"
  }
  return "loading"
}

/** True only when the API confirmed that UniLibrary is on. */
export function useUniLibraryEnabled(): boolean {
  return useUniLibraryAvailability() === "enabled"
}

/** The cards that may be shown: UniLibrary (`kind: "external"`) cards are dropped unless UniLibrary is enabled. */
export function useVisibleCards<T extends { kind: ItemKind }>(items: readonly T[] | undefined): T[] {
  const enabled = useUniLibraryEnabled()
  return useMemo(() => (items ?? []).filter((item) => enabled || item.kind !== "external"), [items, enabled])
}
