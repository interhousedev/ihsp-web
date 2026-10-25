"use client"

import { getAdminAssessmentsQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/** How many dates are not confirmed yet, whatever the filters of the list say. */
export function useTentativeCount(): number {
  const query = useQuery({
    ...getAdminAssessmentsQuery({ status: "tentative" }),
    select: (data) => data.items.length,
  })
  return query.data ?? 0
}
