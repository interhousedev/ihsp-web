"use client"

import { api } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useAdminMutation } from "../shared/hooks/use-admin-mutation"

/**
 * Typed adapter over `/v1/admin/activities/opportunities`, the one catalog shared by admission and my.iht.
 * The routes are not in the generated client yet: swapping to it means replacing this file only.
 * Shapes follow `OpportunityOut`/`OpportunityFields` (admission) and the route tests of the backend.
 */

export const KINDS = ["exam", "certification", "course", "event", "recurring", "program", "scholarship", "research"] as const
export type Kind = (typeof KINDS)[number]
/** Backend surfaces: `admission` (applicants) and `my_iht` (students). */
export type Surface = "admission" | "my_iht"
export const AUDIENCES = ["applicant", "student", "both"] as const
export type Audience = (typeof AUDIENCES)[number]
export const STATUSES = ["published", "archived"] as const
export type Status = (typeof STATUSES)[number]

export type Activity = {
  id: string
  lockVersion: number
  kind: Kind
  audience: Audience
  status: Status
  title: string
  summary: string
  org: string
  link: string
  deadline: string | null
}

export type ActivityDraft = Omit<Activity, "id" | "lockVersion" | "status">

type OpportunityOut = {
  id: string
  kind: Kind
  title: string
  summary?: string | null
  url?: string | null
  provider?: string | null
  registration_deadlines?: string[]
  archived: boolean
  lock_version: number
  audience?: Surface[]
}

const BASE = "/v1/admin/activities/opportunities"
const toSurfaces = (a: Audience): Surface[] => (a === "applicant" ? ["admission"] : a === "student" ? ["my_iht"] : ["admission", "my_iht"])
const fromSurfaces = (s: Surface[] | undefined): Audience => {
  const admission = !s || s.includes("admission")
  const mine = !s || s.includes("my_iht")
  return admission && mine ? "both" : mine ? "student" : "applicant"
}

const toActivity = (o: OpportunityOut): Activity => ({
  id: o.id,
  lockVersion: o.lock_version,
  kind: o.kind,
  audience: fromSurfaces(o.audience),
  status: o.archived ? "archived" : "published",
  title: o.title,
  summary: o.summary ?? "",
  org: o.provider ?? "",
  link: o.url ?? "",
  deadline: o.registration_deadlines?.[0] ?? null,
})

const toBody = (d: ActivityDraft) => ({
  kind: d.kind,
  title: d.title.trim(),
  summary: d.summary.trim() || null,
  url: d.link.trim() || null,
  provider: d.org.trim() || null,
  registration_deadlines: d.deadline ? [d.deadline] : [],
  audience: toSurfaces(d.audience),
})

export const activitiesKey = ["admin", "activities", "opportunities"] as const

export function useActivities() {
  return useQuery({
    queryKey: [...activitiesKey, "all"],
    queryFn: async ({ signal }) => (await api.get<{ items: OpportunityOut[] }>(BASE, { signal, query: { include_archived: true } })).items.map(toActivity),
  })
}

export function useSaveActivity(onDone: () => void) {
  return useAdminMutation<{ id: string | null; lockVersion: number; draft: ActivityDraft }, unknown>({
    mutationFn: ({ id, lockVersion, draft }) =>
      id ? api.patch(`${BASE}/${id}`, { ...toBody(draft), lock_version: lockVersion }) : api.post(BASE, toBody(draft)),
    invalidate: [activitiesKey],
    onSuccess: onDone,
  })
}

export function useArchiveActivity() {
  return useAdminMutation<{ id: string; archived: boolean }, unknown>({
    mutationFn: ({ id, archived }) => api.post(`${BASE}/${id}:archive`, { archived }),
    invalidate: [activitiesKey],
  })
}
