import type { Audience, BroadcastItem } from "@ihsp/api"
import { ids, persons } from "./world"

export const audienceEveryone: Audience = { everyone: true, roles: [], group_ids: [], semesters: [] }
export const audienceGroup2TN2: Audience = {
  everyone: false,
  roles: ["student"],
  group_ids: [ids.group2TN2],
  semesters: [],
}

export const broadcastDraft: BroadcastItem = {
  id: ids.broadcast,
  title: "Midterm schedule",
  text: "<b>Midterm tests</b> start on <i>12 October</i>. Details in the portal.",
  media_file_ids: [],
  audience: audienceGroup2TN2,
  status: "draft",
  scheduled_at: null,
  created_via: "ui",
  author: persons.admin,
  stats: null,
  created_at: "2026-10-06T10:00:00Z",
}

export const broadcastScheduled: BroadcastItem = {
  ...broadcastDraft,
  id: "0000000d-0000-4000-8000-000000000002",
  title: "Parents' meeting",
  text: "Parents' meeting on Friday at 10:00.",
  audience: audienceEveryone,
  status: "scheduled",
  scheduled_at: "2026-10-09T05:00:00Z",
}

export const broadcastSent: BroadcastItem = {
  ...broadcastDraft,
  id: "0000000d-0000-4000-8000-000000000003",
  title: "Autumn break schedule",
  text: "Classes are cancelled on 1 October.",
  audience: audienceEveryone,
  status: "sent",
  scheduled_at: null,
  stats: { total: 42, sent: 39, failed: 1, blocked: 2 },
  created_at: "2026-10-05T08:55:00Z",
}

export const broadcastItems: BroadcastItem[] = [broadcastDraft, broadcastScheduled, broadcastSent]

/** Live audience count: 4 students in 2TN2, 42 users in total. */
export function audienceCountFor(audience: Audience): number {
  if (audience.everyone) return 42
  if (audience.group_ids.length > 0) return 4 * audience.group_ids.length
  if (audience.roles.includes("teacher")) return 6
  return 42
}
