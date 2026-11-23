"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

// Local mirrors of the backend schemas until `openapi.json` is exported (schemas_trajectories.py).

export const FIELDS = [
  "cs_it",
  "engineering",
  "business_econ",
  "medicine_bio",
  "natural_sci",
  "social_law",
  "arts_media",
  "education_hum",
] as const
export const NODE_KINDS = ["topic", "course", "book", "project", "exam", "milestone"] as const
export const LEVELS = ["beginner", "intermediate", "advanced"] as const
export const NODE_STATUSES = ["done", "in_progress", "skipped"] as const
export const LIMITS = { stages: 12, nodes: 150, resources: 8, title: 160, description: 2000 } as const

export type Field = (typeof FIELDS)[number]
export type NodeKind = (typeof NODE_KINDS)[number]
export type Level = (typeof LEVELS)[number]
export type NodeStatus = (typeof NODE_STATUSES)[number]
export type ResourceKind = "lms_course" | "library_book" | "url"
export type I18n = { en: string; ru: string; uz: string }
export type Lang = keyof I18n

export type ResourceIo = { kind: ResourceKind; ref: string; title: string }
export type ResourceOut = ResourceIo & { url: string }
export type NodeIn = {
  id: string
  title: I18n
  kind: NodeKind
  level: Level
  description: I18n
  optional: boolean
  resources: ResourceIo[]
}
export type NodeOut = Omit<NodeIn, "resources"> & { position: number; resources: ResourceOut[] }
export type StageIn = { id: string; title: I18n; nodes: NodeIn[] }
export type StageOut = { id: string; title: I18n; nodes: NodeOut[] }
export type EdgeIo = { before: string; after: string }

// mirrors openapi admission_staff_trajectories_create (request body TrajectoryIn)
export type TrajectoryIn = {
  slug: string
  field: Field
  title: I18n
  description: I18n
  published: boolean
  stages: StageIn[]
  edges: EdgeIo[]
}
// mirrors openapi admission_staff_trajectories_get (TrajectoryOut)
export type Trajectory = Omit<TrajectoryIn, "stages"> & {
  id: string
  stages: StageOut[]
  created_at: string
  updated_at: string
}
// mirrors openapi admission_trajectories_list (TrajectorySummaryOut)
export type TrajectorySummary = {
  id: string
  slug: string
  field: Field
  title: I18n
  description: I18n
  published: boolean
  stage_count: number
  node_count: number
  required_count: number
  done_count: number
}
export type NodeProgress = { node_id: string; status: NodeStatus }
// mirrors openapi admission_trajectories_get (TrajectoryDetailOut)
export type TrajectoryDetail = { trajectory: Trajectory; progress: NodeProgress[]; can_track: boolean }
// mirrors openapi admission_staff_trajectories_resources (ResourceHitOut)
export type ResourceHit = { kind: ResourceKind; ref: string; title: string; subtitle: string; url: string }

const PUBLIC = "/v1/admission/trajectories"
const STAFF = "/v1/admission/staff/trajectories"
const KEY = ["admission", "trajectories"] as const
const enc = encodeURIComponent

/** The text in the reader's language, falling back to English and then any language. */
export function pick(text: I18n | undefined, lang: string): string {
  if (!text) return ""
  return text[lang as Lang] || text.en || text.ru || text.uz || ""
}

/** mirrors openapi admission_trajectories_list */
export function useTrajectories(q: string, field: string) {
  return useQuery({
    queryKey: [...KEY, "list", q, field] as const,
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: TrajectorySummary[] }>(PUBLIC, {
        signal,
        query: { q: q || undefined, field: field || undefined },
      }),
  })
}

/** mirrors openapi admission_trajectories_get */
export function useTrajectory(slug: string) {
  return useQuery({
    queryKey: [...KEY, "one", slug] as const,
    enabled: slug.length > 0,
    queryFn: ({ signal }) => getApiClient().get<TrajectoryDetail>(`${PUBLIC}/${enc(slug)}`, { signal }),
  })
}

/** mirrors openapi admission_trajectories_mark_node */
export function useMarkNode(slug: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (v: { trajectoryId: string; nodeId: string; status: NodeStatus | null }) =>
      getApiClient().put<TrajectoryDetail>(`${PUBLIC}/${enc(v.trajectoryId)}/progress/${enc(v.nodeId)}`, {
        status: v.status,
      }),
    onSuccess: (data) => {
      client.setQueryData([...KEY, "one", slug], data)
      void client.invalidateQueries({ queryKey: [...KEY, "list"] })
    },
  })
}

/** mirrors openapi admission_staff_trajectories_list */
export function useStaffTrajectories() {
  return useQuery({
    queryKey: [...KEY, "staff"] as const,
    queryFn: ({ signal }) => getApiClient().get<{ items: TrajectorySummary[] }>(STAFF, { signal }),
  })
}

/** mirrors openapi admission_staff_trajectories_get */
export function useStaffTrajectory(id: string) {
  return useQuery({
    queryKey: [...KEY, "staff", id] as const,
    enabled: id.length > 0,
    queryFn: ({ signal }) => getApiClient().get<Trajectory>(`${STAFF}/${enc(id)}`, { signal }),
  })
}

/** mirrors openapi admission_staff_trajectories_resources */
export function useResourceSearch(kind: Exclude<ResourceKind, "url">, q: string, enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, "resources", kind, q] as const,
    enabled,
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: ResourceHit[] }>(`${STAFF}/resources`, {
        signal,
        query: { kind, q: q || undefined },
      }),
  })
}

/** mirrors openapi admission_staff_trajectories_create / _update / _delete */
export function useStaffTrajectoryMutations() {
  const client = useQueryClient()
  const done = () => client.invalidateQueries({ queryKey: KEY })
  const create = useMutation({
    mutationFn: (body: TrajectoryIn) => getApiClient().post<Trajectory>(STAFF, body),
    // Seed the editor's query so the page reopened on the new id shows the saved trajectory at once.
    onSuccess: (made) => {
      client.setQueryData([...KEY, "staff", made.id], made)
      return done()
    },
  })
  const update = useMutation({
    mutationFn: (v: { id: string; body: TrajectoryIn }) =>
      getApiClient().put<Trajectory>(`${STAFF}/${enc(v.id)}`, v.body),
    onSuccess: done,
  })
  const remove = useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${STAFF}/${enc(id)}`),
    onSuccess: done,
  })
  return { create, update, remove }
}
