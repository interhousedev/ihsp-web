"use client"

import { getWorkOffTemplatesQuery, type WorkOffTemplate } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

const NO_TEMPLATES: WorkOffTemplate[] = []

/** The teacher's own work-off templates; an empty list while loading or when the load failed. */
export function useWorkOffTemplates(): WorkOffTemplate[] {
  const query = useQuery(getWorkOffTemplatesQuery())
  return query.data ?? NO_TEMPLATES
}
