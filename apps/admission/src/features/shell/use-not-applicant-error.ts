"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { isNotApplicant } from "../../config/applicant"

/** True once a query of the page failed with 403 `admission/not_applicant`: the caller is not an applicant. */
export function useNotApplicantError(): boolean {
  const cache = useQueryClient().getQueryCache()
  const [found, setFound] = useState(() => cache.getAll().some((query) => isNotApplicant(query.state.error)))
  useEffect(
    () =>
      cache.subscribe((event) => {
        if (event.type === "updated" && isNotApplicant(event.query.state.error)) setFound(true)
      }),
    [cache],
  )
  return found
}
