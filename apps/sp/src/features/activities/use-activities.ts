"use client"

import { apiAbsoluteUrl, getLmsCoursesQuery, getLmsMyCoursesQuery, type CourseCard } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import {
  activitiesApi,
  type ClubCapability,
  type ClubProfilePatch,
  type FormFieldDef,
  type MemberRole,
  type MemberView,
} from "./api/activities-api"

const K = {
  all: ["activities"] as const,
  public: ["activities", "public-clubs"] as const,
  mine: ["activities", "mine"] as const,
}
const club = (id: string, ...rest: string[]) => ["activities", "club", id, ...rest] as const

/** Stable accent hue for a club or person that has no uploaded picture. */
export function hueOf(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 360
  return h
}

/** A club of the feed: the list row plus the public logo. */
export type ClubSummary = {
  id: string
  slug: string
  name: string
  description: string
  kind: "club" | "su"
  category: string | null
  joinPolicy: "open" | "request" | "invite"
  logoUrl: string | null
  capabilities: ClubCapability[]
  memberCount: number
  isMine: boolean
  myRole: string | null
  ownerId: string | null
}

const policy = (value: string | undefined): ClubSummary["joinPolicy"] =>
  value === "open" || value === "invite" ? value : "request"

/** Active clubs with member counts and the caller's role (`GET /clubs`). */
export function useClubs(category?: string) {
  const list = useQuery({
    queryKey: [...K.all, "list", category ?? ""],
    queryFn: () => activitiesApi.clubList(category),
  })
  const clubs = useMemo<ClubSummary[]>(() => {
    return (list.data?.items ?? []).map(({ club: c, member_count, my_role, my_status }) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description ?? "",
      kind: c.kind,
      category: c.category && c.category !== "" ? c.category : null,
      joinPolicy: policy(c.join_policy),
      logoUrl: c.logo_url ? apiAbsoluteUrl(c.logo_url) : null,
      capabilities: c.capabilities ?? [],
      memberCount: member_count,
      isMine: my_status === "active",
      myRole: my_role,
      ownerId: c.owner_id ?? null,
    }))
  }, [list.data])
  return { clubs, isPending: list.isPending, isError: list.isError, error: list.error }
}

export type Viewer = {
  /** The caller's standing; `guest` is anyone who is not in the club. */
  role: MemberRole | "guest"
  isMember: boolean
  /** Organizers see the management page. */
  isStaff: boolean
  isOwner: boolean
  /** The club's own page and form may be edited (owner and co-owner). */
  canEdit: boolean
  canApprove: boolean
  canManageEvents: boolean
  canViewMembers: boolean
  /** Platform administrators switch the functions of a club on and off. */
  isAdmin: boolean
  userId: string | null
  /** Pending join request. */
  requested: boolean
}

/** One club by slug with the caller's standing from `GET /clubs/{id}/me`. */
export function useClub(slug: string | null, id?: string | null) {
  const { clubs, isPending, isError, error } = useClubs()
  const summary = clubs.find((c) => (id ? c.id === id : c.slug === slug)) ?? null
  const clubId = summary?.id ?? ""
  const detail = useQuery({ queryKey: club(clubId), queryFn: () => activitiesApi.club(clubId), enabled: clubId !== "" })
  const standing = useQuery({
    queryKey: club(clubId, "me"),
    queryFn: () => activitiesApi.myStanding(clubId),
    enabled: clubId !== "",
  })
  const { session } = useSession()
  const me = standing.data
  const members = useClubMembers(me?.can_view_members === true ? clubId : "")
  const role = (me?.role as MemberRole | null | undefined) ?? "guest"
  const viewer: Viewer = {
    role,
    isMember: me?.is_member === true,
    isStaff: me?.is_organizer === true,
    isOwner: role === "owner",
    canEdit: me?.can_edit === true,
    canApprove: me?.can_approve === true,
    canManageEvents: me?.can_manage_events === true,
    canViewMembers: me?.can_view_members === true,
    isAdmin: session?.user.roles.includes("admin") === true,
    userId: session?.user.id ?? null,
    requested: me?.status === "requested",
  }
  const merged: ClubSummary | null = summary
    ? {
        ...summary,
        capabilities: detail.data?.capabilities ?? summary.capabilities,
        ownerId: detail.data?.owner_id ?? summary.ownerId,
      }
    : null
  return {
    club: merged,
    detail: detail.data ?? null,
    viewer,
    isPending: isPending || (clubId !== "" && standing.isPending),
    isError,
    error,
    members: members.data?.items ?? [],
  }
}

export function useClubMembers(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "members"),
    queryFn: () => activitiesApi.members(clubId),
    enabled: clubId !== "",
    retry: false,
  })
}

export function usePublicClub(slug: string | null) {
  return useQuery({
    queryKey: ["activities", "public-club", slug],
    queryFn: () => activitiesApi.publicClub(slug ?? ""),
    enabled: !!slug,
  })
}

export function useOpportunities() {
  return useQuery({ queryKey: ["activities", "opportunities"], queryFn: () => activitiesApi.opportunities() })
}

export function useEvents() {
  return useQuery({ queryKey: ["activities", "events"], queryFn: () => activitiesApi.events() })
}

export function useClubEvents(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "events"),
    queryFn: () => activitiesApi.clubEvents(clubId),
    enabled: clubId !== "",
  })
}

export function useEvent(eventId: string | null) {
  return useQuery({
    queryKey: ["activities", "event", eventId],
    queryFn: () => activitiesApi.event(eventId ?? ""),
    enabled: !!eventId,
  })
}

export function useMyRsvp(eventId: string | null) {
  return useQuery({
    queryKey: ["activities", "event", eventId, "rsvp"],
    queryFn: () => activitiesApi.myRsvp(eventId ?? ""),
    enabled: !!eventId,
  })
}

export function useEventQr(eventId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["activities", "event", eventId, "qr"],
    queryFn: () => activitiesApi.eventQr(eventId ?? ""),
    enabled: !!eventId && enabled,
    retry: false,
  })
}

/** RSVP and its cancellation for one event. */
export function useRsvpMutation(eventId: string) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ["activities", "event", eventId] })
  const set = useMutation({ mutationFn: () => activitiesApi.rsvp(eventId), onSuccess: refresh })
  const cancel = useMutation({ mutationFn: () => activitiesApi.cancelRsvp(eventId), onSuccess: refresh })
  return { set, cancel }
}

export function useJoinClub(clubId: string) {
  const qc = useQueryClient()
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: K.mine })
    void qc.invalidateQueries({ queryKey: club(clubId) })
  }
  const join = useMutation({
    mutationFn: (message?: string) => activitiesApi.join(clubId, message),
    onSuccess: refresh,
  })
  const leave = useMutation({ mutationFn: () => activitiesApi.leave(clubId), onSuccess: refresh })
  return { join, leave }
}

export function useClubRatings(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "ratings"),
    queryFn: () => activitiesApi.ratingsSummary(clubId),
    enabled: clubId !== "",
  })
}

export function useRateClub(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof activitiesApi.rateClub>[1]) => activitiesApi.rateClub(clubId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: club(clubId, "ratings") }),
  })
}

export function usePositions(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "positions"),
    queryFn: () => activitiesApi.positions(clubId),
    enabled: clubId !== "",
  })
}

export function useApply() {
  return useMutation({
    mutationFn: ({ positionId, answers }: { positionId: string; answers: Record<string, unknown> }) =>
      activitiesApi.apply(positionId, answers),
  })
}

export function useApplications(positionId: string) {
  return useQuery({
    queryKey: ["activities", "applications", positionId],
    queryFn: () => activitiesApi.applications(positionId),
    enabled: positionId !== "",
  })
}

export function useApplicationAction(positionId: string) {
  const qc = useQueryClient()
  const done = () => {
    void qc.invalidateQueries({ queryKey: ["activities", "applications", positionId] })
  }
  return {
    shortlist: useMutation({ mutationFn: (id: string) => activitiesApi.shortlistApplication(id), onSuccess: done }),
    reject: useMutation({ mutationFn: (id: string) => activitiesApi.rejectApplication(id), onSuccess: done }),
    accept: useMutation({ mutationFn: (id: string) => activitiesApi.acceptApplication(id), onSuccess: done }),
  }
}

export function useMemberActions(clubId: string) {
  const qc = useQueryClient()
  const done = () => qc.invalidateQueries({ queryKey: club(clubId, "members") })
  return {
    approve: useMutation({
      mutationFn: (userId: string) => activitiesApi.approveMember(clubId, userId),
      onSuccess: done,
    }),
    remove: useMutation({ mutationFn: (userId: string) => activitiesApi.banMember(clubId, userId), onSuccess: done }),
    transfer: useMutation({ mutationFn: (userId: string) => activitiesApi.transferOwnership(clubId, userId) }),
  }
}

export function useAnnouncements(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "announcements"),
    queryFn: () => activitiesApi.announcements(clubId),
    enabled: clubId !== "",
  })
}

export function useAnnouncementActions(clubId: string) {
  const qc = useQueryClient()
  const done = () => qc.invalidateQueries({ queryKey: club(clubId, "announcements") })
  return {
    send: useMutation({
      mutationFn: (body: Parameters<typeof activitiesApi.announce>[1]) => activitiesApi.announce(clubId, body),
      onSuccess: done,
    }),
    cancel: useMutation({ mutationFn: (id: string) => activitiesApi.cancelAnnouncement(id), onSuccess: done }),
  }
}

export function usePlanner(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "planner"),
    queryFn: () => activitiesApi.planner(clubId),
    enabled: clubId !== "",
  })
}

export function usePlannerActions(clubId: string) {
  const qc = useQueryClient()
  const done = () => qc.invalidateQueries({ queryKey: club(clubId, "planner") })
  return {
    add: useMutation({
      mutationFn: (body: Parameters<typeof activitiesApi.addPlannerItem>[1]) =>
        activitiesApi.addPlannerItem(clubId, body),
      onSuccess: done,
    }),
    move: useMutation({
      mutationFn: ({ id, status }: { id: string; status: Parameters<typeof activitiesApi.movePlannerItem>[1] }) =>
        activitiesApi.movePlannerItem(id, status),
      onSuccess: done,
    }),
  }
}

export function useMyProfile(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "profile"),
    queryFn: () => activitiesApi.profile(clubId),
    enabled: clubId !== "",
  })
}

export function useSaveProfile(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (answers: Record<string, unknown>) => activitiesApi.saveProfile(clubId, answers),
    onSuccess: () => qc.invalidateQueries({ queryKey: club(clubId, "profile") }),
  })
}

export function useDraftRounds(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "draft-rounds"),
    queryFn: () => activitiesApi.clubDraftRounds(clubId),
    enabled: clubId !== "",
  })
}

export function useDraftActions(clubId: string) {
  const qc = useQueryClient()
  const done = () => qc.invalidateQueries({ queryKey: club(clubId, "draft-rounds") })
  return {
    signup: useMutation({
      mutationFn: ({ roundId, role }: { roundId: string; role: string }) => activitiesApi.signup(roundId, role),
      onSuccess: done,
    }),
    respond: useMutation({
      mutationFn: ({ pickId, accept }: { pickId: string; accept: boolean }) =>
        activitiesApi.respondPick(pickId, accept),
      onSuccess: done,
    }),
    pick: useMutation({
      mutationFn: async ({ roundId, userId, role }: { roundId: string; userId: string; role: string }) => {
        const pick = await activitiesApi.pick(roundId, userId, role)
        return pick.id ? activitiesApi.invitePick(pick.id) : pick
      },
      onSuccess: done,
    }),
  }
}

export function useRanking(roundId: string) {
  return useQuery({
    queryKey: ["activities", "ranking", roundId],
    queryFn: () => activitiesApi.ranking(roundId),
    enabled: roundId !== "",
  })
}

export function useLeaderboard(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "leaderboard"),
    queryFn: () => activitiesApi.leaderboard(clubId),
    enabled: clubId !== "",
  })
}

export function useMyPoints(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "points"),
    queryFn: () => activitiesApi.myPoints(clubId),
    enabled: clubId !== "",
  })
}

export function useLeaderboardOptOut() {
  return useMutation({ mutationFn: (optedOut: boolean) => activitiesApi.setLeaderboardOptOut(optedOut) })
}

/** Saves the club's own page (owner) or its functions (platform administrator) with `PATCH /clubs/{id}`. */
export function usePatchClub(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ClubProfilePatch) => activitiesApi.patchClub(clubId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: K.all }),
  })
}

export function useCapabilities(clubId: string) {
  const patch = usePatchClub(clubId)
  return { ...patch, mutate: (capabilities: ClubCapability[]) => patch.mutate({ capabilities }) }
}

export function useClubFormFields(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "form-fields"),
    queryFn: () => activitiesApi.formFields(clubId),
    enabled: clubId !== "",
  })
}

export function useSaveFormFields(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fields: FormFieldDef[]) => activitiesApi.saveFormFields(clubId, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: club(clubId, "form-fields") }),
  })
}

export function useFormAnswers(clubId: string, enabled: boolean) {
  return useQuery({
    queryKey: club(clubId, "form-answers"),
    queryFn: () => activitiesApi.formAnswers(clubId),
    enabled: clubId !== "" && enabled,
  })
}

export function usePointsRules(clubId: string) {
  return useQuery({
    queryKey: club(clubId, "points-rules"),
    queryFn: () => activitiesApi.pointsRules(clubId),
    enabled: clubId !== "",
  })
}

export function usePointsActions(clubId: string) {
  const qc = useQueryClient()
  return {
    saveRules: useMutation({
      mutationFn: (rules: Record<string, number>) => activitiesApi.savePointsRules(clubId, rules),
      onSuccess: () => qc.invalidateQueries({ queryKey: club(clubId, "points-rules") }),
    }),
    award: useMutation({
      mutationFn: (body: { user_id: string; points: number; reason: string }) =>
        activitiesApi.awardPoints(clubId, body),
      onSuccess: () => qc.invalidateQueries({ queryKey: club(clubId, "leaderboard") }),
    }),
  }
}

export function useCreateEvent(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof activitiesApi.createEvent>[1]) => activitiesApi.createEvent(clubId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: club(clubId, "events") }),
  })
}

export function useCreateRound(clubId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, needed }: { eventId: string; needed: Record<string, number> }) =>
      activitiesApi.createRound(eventId, clubId, needed),
    onSuccess: () => qc.invalidateQueries({ queryKey: club(clubId, "draft-rounds") }),
  })
}

export function useRoundSignups(roundId: string) {
  return useQuery({
    queryKey: ["activities", "signups", roundId],
    queryFn: () => activitiesApi.signups(roundId),
    enabled: roundId !== "",
  })
}

/** Open ownership offers addressed to the caller. */
export function useIncomingTransfers() {
  return useQuery({ queryKey: [...K.all, "incoming-transfers"], queryFn: () => activitiesApi.incomingTransfers() })
}

/** Accepting or declining an ownership transfer offered to the caller. */
export function useTransferAnswer() {
  const qc = useQueryClient()
  const done = () => qc.invalidateQueries({ queryKey: K.all })
  return {
    accept: useMutation({ mutationFn: (id: string) => activitiesApi.acceptTransfer(id), onSuccess: done }),
    decline: useMutation({ mutationFn: (id: string) => activitiesApi.declineTransfer(id), onSuccess: done }),
  }
}

/** Courses linked to a club with their LMS titles; `mine` are the courses the caller manages (linking them needs no confirmation). */
export function useClubCourses(clubId: string) {
  const links = useQuery({
    queryKey: club(clubId, "courses"),
    queryFn: () => activitiesApi.clubCourses(clubId),
    enabled: clubId !== "",
  })
  const catalogue = useQuery(getLmsCoursesQuery())
  const managed = useQuery({ ...getLmsMyCoursesQuery(), retry: false })
  const byId = useMemo(
    () => new Map<string, CourseCard>((catalogue.data ?? []).map((c) => [c.id, c])),
    [catalogue.data],
  )
  const mineIds = useMemo(() => new Set((managed.data?.managed ?? []).map((c) => c.id)), [managed.data])
  return {
    links: links.data?.items ?? [],
    isPending: links.isPending,
    isError: links.isError,
    error: links.error,
    byId,
    mineIds,
    courses: catalogue.data ?? [],
  }
}

export function useCourseLinkActions(clubId: string) {
  const qc = useQueryClient()
  const done = () => qc.invalidateQueries({ queryKey: club(clubId, "courses") })
  return {
    link: useMutation({
      mutationFn: (courseId: string) => activitiesApi.linkCourse(clubId, courseId),
      onSuccess: done,
    }),
    unlink: useMutation({
      mutationFn: (courseId: string) => activitiesApi.unlinkCourse(clubId, courseId),
      onSuccess: done,
    }),
    confirm: useMutation({
      mutationFn: (courseId: string) => activitiesApi.confirmCourse(clubId, courseId),
      onSuccess: done,
    }),
  }
}

export type { MemberView }
