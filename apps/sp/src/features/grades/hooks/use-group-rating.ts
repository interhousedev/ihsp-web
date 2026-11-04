"use client"

import { getMeGroupRatingQuery, isApiError } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/** The group's rating; only the head student gets it, so a 403 is final and is not retried. */
export function useGroupRating(semester: number | undefined) {
  return useQuery({
    ...getMeGroupRatingQuery(semester ? { semester } : undefined),
    retry: (count, error) => !(isApiError(error) && error.status === 403) && count < 2,
  })
}
