import { activities } from "@ihsp/api"

/**
 * Calls of `/v1/activities/*` and `/v1/public/clubs*` through the typed `activities` client of `@ihsp/api` (path, method,
 * path parameters and body are checked against `openapi.json`). The generated schema leaves a few free-text fields untyped
 * (`title`, `description`, `label`), so the responses are narrowed to the shapes below. The screens only use the hooks in
 * `../use-activities.ts`.
 */

/** Narrows a response whose generated type leaves free-text fields as `unknown`. */
const as = <T>(p: Promise<unknown>) => p as Promise<T>

export type ClubCapability = "forms" | "drafting" | "points" | "roster"
export type ClubKind = "club" | "su"
export type JoinPolicy = "open" | "request" | "invite"
export type MemberRole = "owner" | "co_owner" | "team" | "member"
export type MemberStatus = "requested" | "active" | "left" | "removed" | "banned"
export type PlannerStatus = "backlog" | "planned" | "doing" | "done"
export type ItemsOut<T> = { items: T[] }

export type Club = {
  id: string
  slug: string
  name: string
  description?: string
  kind: ClubKind
  capabilities?: ClubCapability[]
  join_policy?: JoinPolicy
  status?: "draft" | "pending_review" | "active" | "suspended" | "archived"
  owner_id?: string | null
  created_by: string
  logo_file_id?: string | null
  logo_url?: string | null
  contact_enabled?: boolean
  visibility_public?: boolean
  has_minor_members?: boolean
  published_once?: boolean
  category?: string
  goals?: string
  rules?: string
  schedule?: string
  partners?: string[]
  points_rules?: Record<string, number>
}
/** One row of `GET /v1/activities/clubs`: the club with its member count and the caller's standing. */
export type ClubListItem = { club: Club; member_count: number; my_role: string | null; my_status: string | null }
/** `GET /v1/activities/clubs/{id}/me`: what the caller may do in the club. */
export type MyClub = {
  club_id: string
  is_member: boolean
  is_organizer: boolean
  can_approve: boolean
  can_edit: boolean
  can_manage_events: boolean
  can_view_members: boolean
  role: string | null
  status: string | null
}
export type FormFieldDef = { key: string; label?: string; type?: string; options?: string[]; required?: boolean }
export type MemberAnswers = {
  user_id: string
  display_name: string
  answers: Record<string, unknown>
  updated_at: string
}
export type ClubProfilePatch = {
  name?: string
  description?: string
  category?: string | null
  goals?: string
  rules?: string
  schedule?: string
  partners?: string[]
  join_policy?: JoinPolicy
  capabilities?: ClubCapability[]
}
export type PublicClub = {
  id: string
  slug: string
  name: string
  description: string
  join_policy: string
  logo_url: string | null
  contact_enabled: boolean
}
export type PublicTeamMember = { name: string; position: string; bio: string; photo_url: string | null }
export type PublicClubPage = PublicClub & { team: PublicTeamMember[] }

export type Membership = {
  club_id: string
  user_id: string
  role: MemberRole
  status: MemberStatus
  declaration_version: number
  joined_at: string | null
  left_at: string | null
}
export type MemberView = { user_id: string; display_name: string; role: string; status: string }

export type ClubEvent = {
  id: string
  club_id: string
  title: string
  description: string
  starts_at: string
  ends_at: string
  location?: string | null
  capacity: number | null
  rsvp_policy: "open" | "members" | "approval"
  status: "draft" | "scheduled" | "cancelled" | "done"
  course_id?: string | null
  opportunity_id?: string | null
}
export type Rsvp = {
  event_id: string
  user_id: string
  status: string
  event_role?: string | null
  checked_in_at?: string | null
  created_at: string
}

export type Announcement = {
  id?: string
  club_id: string
  author_id: string
  text: string
  audience: string
  scheduled_at?: string | null
  sent_at?: string | null
  recipient_count?: number
  cancelled?: boolean
  created_at?: string | null
}
export type AnnouncementIn = { text: string; audience?: string; scheduled_at?: string | null }

export type TeamPosition = {
  id: string
  club_id: string
  title: string
  description: string
  slots: number
  open_for_applications: boolean
  form_schema: FormSchema
}
/** `form_schema` of a position: `{fields: [{key, type, label?, options?, required?}]}` (backend `validate_form_schema`). */
export type FormField = {
  key: string
  type: "text" | "choice" | "number" | "bool"
  label?: string
  options?: string[]
  required?: boolean
  max_length?: number
}
export type FormSchema = { fields?: FormField[] }
export type PositionApplication = {
  id?: string
  position_id: string
  user_id: string
  status?: string
  note?: string | null
  answers: Record<string, unknown>
}

export type ClubCourseLink = {
  id?: string
  club_id: string
  course_id: string
  status: string
  requested_by: string
  requested_side: string
  requested_at: string
  confirmed_at?: string | null
}
export type PointEntry = { at: string; points: number; reason: string }
export type MyPoints = { total: number; entries: PointEntry[] }
export type LeaderRow = { rank: number; display_name: string; points: number }
export type RatingAggregate = { avg: number | null; count: number; aspects: Record<string, number> }
export type RatingsSummary = {
  club: RatingAggregate
  events: RatingAggregate
  comments: { id: string; score: number; comment: string | null; created_at: string; aspects: Record<string, number> }[]
}
export type RatingIn = {
  score: number
  aspects?: Record<string, number>
  comment?: string | null
  anonymous_to_club?: boolean
}

export type DraftRound = {
  id?: string
  club_id: string
  event_id: string
  status?: string
  needed: Record<string, number>
}
export type DraftPick = { id?: string; round_id: string; user_id: string; role: string; status?: string }
export type DraftSignup = {
  id?: string
  round_id: string
  user_id: string
  role: string
  status?: string
  answers: Record<string, unknown>
}
export type Ranked = { user_id: string; score: number }

export type PlannerItem = {
  id?: string
  club_id: string
  kind: string
  title: string
  body: string
  status: PlannerStatus
  term: string
  assignee_id: string | null
  due_at: string | null
  event_id: string | null
}
export type PlannerBoard = { completion: number; items: PlannerItem[] }
export type PlannerIn = {
  title: string
  kind?: string
  body?: string
  assignee_id?: string | null
  due_at?: string | null
}

export type OwnershipTransfer = {
  id?: string
  club_id: string
  from_user: string
  to_user: string
  status?: string
  expires_at: string
}

/** One opportunity of the shared activities/admission catalogue (`GET /v1/activities/opportunities`). */
export type Opportunity = {
  id: string
  kind: string
  title: string
  summary: string | null
  provider: string | null
  host_institution: string | null
  amount_text: string | null
  registration_deadlines: string[]
  starts_on: string | null
  location: string | null
  online: boolean
  url: string | null
  logo_url: string | null
  lms_course_id: string | null
}

export const activitiesApi = {
  // Clubs
  publicClubs: () => as<{ items: PublicClub[] }>(activities.get("/v1/public/clubs")),
  publicClub: (slug: string) => as<PublicClubPage>(activities.get("/v1/public/clubs/{slug}", { path: { slug } })),
  clubList: () => as<ItemsOut<ClubListItem>>(activities.get("/v1/activities/clubs")),
  setCapabilities: (club_id: string, capabilities: ClubCapability[]) =>
    as<Club>(
      activities.put("/v1/admin/activities/clubs/{club_id}/capabilities", {
        path: { club_id },
        body: { capabilities },
      }),
    ),
  myClubs: () => as<ItemsOut<Club>>(activities.get("/v1/activities/clubs/mine")),
  createClub: (body: { name: string; slug: string; description: string }) =>
    as<{ id: string; status: string }>(activities.post("/v1/activities/clubs", { body: body as never })),
  submitClub: (club_id: string) =>
    as<{ id: string; status: string }>(activities.post("/v1/activities/clubs/{club_id}:submit", { path: { club_id } })),
  club: (club_id: string) => as<Club>(activities.get("/v1/activities/clubs/{club_id}", { path: { club_id } })),
  myStanding: (club_id: string) =>
    as<MyClub>(activities.get("/v1/activities/clubs/{club_id}/me", { path: { club_id } })),
  patchClub: (club_id: string, body: ClubProfilePatch) =>
    as<Club>(activities.patch("/v1/activities/clubs/{club_id}", { path: { club_id }, body: body as never })),
  join: (club_id: string, message?: string) =>
    as<Membership>(
      activities.post("/v1/activities/clubs/{club_id}/join", {
        path: { club_id },
        ...(message ? { body: { message } } : {}),
      } as never),
    ),
  leave: (club_id: string) =>
    as<{ status?: string }>(activities.post("/v1/activities/clubs/{club_id}/leave", { path: { club_id } })),
  members: (club_id: string) =>
    as<ItemsOut<MemberView>>(activities.get("/v1/activities/clubs/{club_id}/members", { path: { club_id } })),
  approveMember: (club_id: string, user_id: string) =>
    as<Membership>(
      activities.post("/v1/activities/clubs/{club_id}/members/{user_id}:approve", { path: { club_id, user_id } }),
    ),
  declineMember: (club_id: string, user_id: string) =>
    as<Membership>(
      activities.post("/v1/activities/clubs/{club_id}/members/{user_id}:decline", { path: { club_id, user_id } }),
    ),
  removeMember: (club_id: string, user_id: string) =>
    as<Membership>(
      activities.post("/v1/activities/clubs/{club_id}/members/{user_id}:remove", { path: { club_id, user_id } }),
    ),
  banMember: (club_id: string, user_id: string, reason?: string) =>
    as<Membership>(
      activities.post("/v1/activities/clubs/{club_id}/members/{user_id}:ban", {
        path: { club_id, user_id },
        body: { reason } as never,
      }),
    ),
  transferOwnership: (club_id: string, to_user_id: string) =>
    as<OwnershipTransfer>(
      activities.post("/v1/activities/clubs/{club_id}/transfers", { path: { club_id }, body: { to_user_id } }),
    ),
  incomingTransfers: () => as<OwnershipTransfer[]>(activities.get("/v1/activities/transfers/incoming")),
  acceptTransfer: (transfer_id: string) =>
    as<OwnershipTransfer>(activities.post("/v1/activities/transfers/{transfer_id}:accept", { path: { transfer_id } })),
  declineTransfer: (transfer_id: string) =>
    as<OwnershipTransfer>(activities.post("/v1/activities/transfers/{transfer_id}:decline", { path: { transfer_id } })),

  // Events
  events: () => as<ItemsOut<ClubEvent>>(activities.get("/v1/activities/events")),
  clubEvents: (club_id: string) =>
    as<ItemsOut<ClubEvent>>(activities.get("/v1/activities/clubs/{club_id}/events", { path: { club_id } })),
  event: (event_id: string) =>
    as<ClubEvent>(activities.get("/v1/activities/events/{event_id}", { path: { event_id } })),
  createEvent: (
    club_id: string,
    body: Pick<ClubEvent, "title" | "description" | "starts_at" | "ends_at"> & Partial<ClubEvent>,
  ) =>
    as<{ id: string }>(
      activities.post("/v1/activities/clubs/{club_id}/events", { path: { club_id }, body: body as never }),
    ),
  publishEvent: (event_id: string) =>
    as<ClubEvent>(activities.post("/v1/activities/events/{event_id}:publish", { path: { event_id } })),
  cancelEvent: (event_id: string) =>
    as<ClubEvent>(activities.post("/v1/activities/events/{event_id}:cancel", { path: { event_id } })),
  finishEvent: (event_id: string) =>
    as<ClubEvent>(activities.post("/v1/activities/events/{event_id}:finish", { path: { event_id } })),
  myRsvp: (event_id: string) =>
    as<Rsvp | null>(activities.get("/v1/activities/events/{event_id}/rsvp", { path: { event_id } })),
  rsvp: (event_id: string) => as<Rsvp>(activities.put("/v1/activities/events/{event_id}/rsvp", { path: { event_id } })),
  cancelRsvp: (event_id: string) => activities.delete("/v1/activities/events/{event_id}/rsvp", { path: { event_id } }),
  eventQr: (event_id: string) =>
    as<{ token: string }>(activities.get("/v1/activities/events/{event_id}/qr", { path: { event_id } })),
  rateEvent: (event_id: string, body: RatingIn) =>
    activities.post("/v1/activities/events/{event_id}/ratings", { path: { event_id }, body: body as never }),

  // Announcements
  announcements: (club_id: string) =>
    as<ItemsOut<Announcement>>(activities.get("/v1/activities/clubs/{club_id}/announcements", { path: { club_id } })),
  announce: (club_id: string, body: AnnouncementIn) =>
    as<Announcement>(
      activities.post("/v1/activities/clubs/{club_id}/announcements", { path: { club_id }, body: body as never }),
    ),
  cancelAnnouncement: (announcement_id: string) =>
    as<Announcement>(
      activities.post("/v1/activities/announcements/{announcement_id}:cancel", { path: { announcement_id } }),
    ),

  // Team
  positions: (club_id: string) =>
    as<ItemsOut<TeamPosition>>(activities.get("/v1/activities/clubs/{club_id}/positions", { path: { club_id } })),
  applications: (position_id: string) =>
    as<ItemsOut<PositionApplication>>(
      activities.get("/v1/activities/positions/{position_id}/applications", { path: { position_id } }),
    ),
  apply: (position_id: string, answers: Record<string, unknown>) =>
    as<PositionApplication>(
      activities.post("/v1/activities/positions/{position_id}/applications", {
        path: { position_id },
        body: { answers } as never,
      }),
    ),
  shortlistApplication: (application_id: string) =>
    as<PositionApplication>(
      activities.post("/v1/activities/applications/{application_id}:shortlist", { path: { application_id } }),
    ),
  rejectApplication: (application_id: string) =>
    as<PositionApplication>(
      activities.post("/v1/activities/applications/{application_id}:reject", {
        path: { application_id },
        body: {} as never,
      }),
    ),
  acceptApplication: (application_id: string) =>
    activities.post("/v1/activities/applications/{application_id}:accept", { path: { application_id } }),

  // Member form, its definition and the answers
  profile: (club_id: string) =>
    as<{ answers: Record<string, unknown> } | null>(
      activities.get("/v1/activities/clubs/{club_id}/profile", { path: { club_id } }),
    ),
  saveProfile: (club_id: string, answers: Record<string, unknown>) =>
    as<{ answers: Record<string, unknown> }>(
      activities.put("/v1/activities/clubs/{club_id}/profile", { path: { club_id }, body: { answers } }),
    ),
  formFields: (club_id: string) =>
    as<{ fields: FormFieldDef[] }>(activities.get("/v1/activities/clubs/{club_id}/form-fields", { path: { club_id } })),
  saveFormFields: (club_id: string, fields: FormFieldDef[]) =>
    as<{ fields: FormFieldDef[] }>(
      activities.put("/v1/activities/clubs/{club_id}/form-fields", { path: { club_id }, body: { fields } as never }),
    ),
  formAnswers: (club_id: string) =>
    as<ItemsOut<MemberAnswers>>(activities.get("/v1/activities/clubs/{club_id}/form-answers", { path: { club_id } })),

  // Drafting
  clubDraftRounds: (club_id: string) =>
    as<ItemsOut<DraftRound>>(activities.get("/v1/activities/clubs/{club_id}/draft-rounds", { path: { club_id } })),
  createRound: (event_id: string, club_id: string, needed: Record<string, number>) =>
    as<DraftRound>(
      activities.post("/v1/activities/events/{event_id}/draft-rounds", {
        path: { event_id },
        body: { club_id, needed },
      }),
    ),
  signup: (round_id: string, role: string, answers: Record<string, unknown> = {}) =>
    as<DraftSignup>(
      activities.post("/v1/activities/draft-rounds/{round_id}/signups", {
        path: { round_id },
        body: { role, answers },
      }),
    ),
  signups: (round_id: string) =>
    as<ItemsOut<DraftSignup>>(activities.get("/v1/activities/draft-rounds/{round_id}/signups", { path: { round_id } })),
  ranking: (round_id: string) =>
    as<ItemsOut<Ranked>>(activities.get("/v1/activities/draft-rounds/{round_id}/ranking", { path: { round_id } })),
  pick: (round_id: string, user_id: string, role: string) =>
    as<DraftPick>(
      activities.post("/v1/activities/draft-rounds/{round_id}/picks", { path: { round_id }, body: { user_id, role } }),
    ),
  invitePick: (pick_id: string) =>
    as<DraftPick>(activities.post("/v1/activities/picks/{pick_id}:invite", { path: { pick_id } })),
  respondPick: (pick_id: string, accept: boolean) =>
    as<DraftPick>(activities.post("/v1/activities/picks/{pick_id}:respond", { path: { pick_id }, body: { accept } })),

  // Points and rating
  myPoints: (club_id: string) =>
    as<MyPoints>(activities.get("/v1/activities/clubs/{club_id}/points/me", { path: { club_id } })),
  pointsRules: (club_id: string) =>
    as<{ rules: Record<string, number> }>(
      activities.get("/v1/activities/clubs/{club_id}/points/rules", { path: { club_id } }),
    ),
  savePointsRules: (club_id: string, rules: Record<string, number>) =>
    as<{ rules: Record<string, number> }>(
      activities.put("/v1/activities/clubs/{club_id}/points/rules", { path: { club_id }, body: { rules } }),
    ),
  awardPoints: (club_id: string, body: { user_id: string; points: number; reason: string }) =>
    activities.post("/v1/activities/clubs/{club_id}/points/awards", { path: { club_id }, body }),
  leaderboard: (club_id?: string) =>
    as<ItemsOut<LeaderRow>>(activities.get("/v1/activities/leaderboard", { query: { club_id, limit: 50 } as never })),
  setLeaderboardOptOut: (opted_out: boolean) =>
    as<{ opted_out: boolean }>(activities.put("/v1/activities/me/leaderboard-opt-out", { body: { opted_out } })),
  ratingsSummary: (club_id: string) =>
    as<RatingsSummary>(activities.get("/v1/activities/clubs/{club_id}/ratings/summary", { path: { club_id } })),
  rateClub: (club_id: string, body: RatingIn) =>
    activities.post("/v1/activities/clubs/{club_id}/ratings", { path: { club_id }, body: body as never }),

  // Planner
  planner: (club_id: string) =>
    as<PlannerBoard>(activities.get("/v1/activities/clubs/{club_id}/planner", { path: { club_id } })),
  addPlannerItem: (club_id: string, body: PlannerIn) =>
    as<PlannerItem>(
      activities.post("/v1/activities/clubs/{club_id}/planner", { path: { club_id }, body: body as never }),
    ),
  movePlannerItem: (item_id: string, status: PlannerStatus) =>
    as<PlannerItem>(activities.post("/v1/activities/planner/{item_id}:move", { path: { item_id }, body: { status } })),

  // Club courses (LMS)
  clubCourses: (club_id: string) =>
    as<ItemsOut<ClubCourseLink>>(activities.get("/v1/activities/clubs/{club_id}/courses", { path: { club_id } })),
  linkCourse: (club_id: string, course_id: string) =>
    as<ClubCourseLink>(
      activities.post("/v1/activities/clubs/{club_id}/courses", { path: { club_id }, body: { course_id } }),
    ),
  unlinkCourse: (club_id: string, course_id: string) =>
    activities.delete("/v1/activities/clubs/{club_id}/courses/{course_id}", { path: { club_id, course_id } }),
  confirmCourse: (club_id: string, course_id: string) =>
    as<ClubCourseLink>(
      activities.post("/v1/activities/clubs/{club_id}/courses/{course_id}:confirm", { path: { club_id, course_id } }),
    ),

  // Opportunities feed (shared with admission)
  opportunities: () => as<ItemsOut<Opportunity>>(activities.get("/v1/activities/opportunities")),
}
