"use client"

import { getLmsEngagementSummaryQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { hrefs } from "../../shared/utils/hrefs"
import { XpChip } from "./xp-chip"

/** The XP chip in the header for signed-in users; nothing until the summary loads or when it fails. */
export function HeaderXp() {
  const summary = useQuery({ ...getLmsEngagementSummaryQuery(), retry: false, staleTime: 60_000 })
  if (!summary.data) return null
  return <XpChip xp={summary.data.xp_total} level={summary.data.level} href={hrefs.myCourses()} />
}
