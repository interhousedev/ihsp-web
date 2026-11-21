"use client"

import { useSession } from "@ihsp/auth"
import { useIsAlumnus } from "./applicant"
import { useT } from "@ihsp/i18n"
import { type BottomNavItem, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"

/** The five student sections, in sidebar and phone-bar order (Today, Profile, Universities, Essays, Apply). */
export const SECTION_IDS = ["today", "profile", "universities", "essays", "apply"] as const
export type SectionId = (typeof SECTION_IDS)[number]

/** One part of a section: a route (`/plan/`) or a query tab (`/career/?tab=field`). Titles: `nav.parts.<id>`. */
export type SectionPart = { id: string; url: string; isDefault?: boolean }

export type Section = {
  id: SectionId
  /** Where the sidebar and the phone bar lead. */
  url: string
  icon: "today" | "user2" | "search" | "post" | "files"
  /** Path prefixes that belong to the section; the longest match wins. */
  prefixes: readonly string[]
  parts: readonly SectionPart[]
}

export const SECTIONS: Record<SectionId, Section> = {
  today: {
    id: "today",
    url: "/",
    icon: "today",
    // Only the root itself: `/settings/` and the like stay outside every section.
    prefixes: ["/"],
    parts: [],
  },
  profile: {
    id: "profile",
    url: "/profile/",
    icon: "user2",
    // Career, activities, tests and plan live inside the profile: one place for "who I am and what I have done".
    prefixes: ["/profile", "/career", "/activities", "/plan", "/opportunities", "/tests", "/courses"],
    parts: [
      { id: "overview", url: "/profile/", isDefault: true },
      { id: "professions", url: "/profile/professions/" },
      { id: "career", url: "/career/" },
      { id: "done", url: "/activities/" },
      { id: "ideas", url: "/opportunities/" },
      { id: "planned", url: "/plan/" },
      { id: "tests", url: "/tests/" },
      { id: "courses", url: "/courses/" },
    ],
  },
  universities: {
    id: "universities",
    url: "/chooser/",
    icon: "search",
    prefixes: ["/chooser"],
    parts: [],
  },
  essays: {
    id: "essays",
    url: "/essays/",
    icon: "post",
    prefixes: ["/essays"],
    // One linear stepper on the page itself: no section tabs.
    parts: [],
  },
  apply: {
    id: "apply",
    url: "/documents/",
    icon: "files",
    prefixes: ["/documents", "/deadlines", "/tasks", "/review", "/outcomes"],
    parts: [
      { id: "applications", url: "/documents/" },
      { id: "tasks", url: "/tasks/" },
      { id: "review", url: "/review/" },
      { id: "results", url: "/outcomes/" },
    ],
  },
}

/** Secondary student links (sidebar footer group, phone header menu). Titles: `nav.<id>`. */
export const SECONDARY_LINKS = [
  { id: "faq", url: "/faq/", icon: "chat" },
  { id: "help", url: "/help/", icon: "help" },
  { id: "settings", url: "/settings/", icon: "settings" },
] as const

/** The section a path belongs to (longest matching prefix), or `null` for Home, Settings, staff pages and the like. */
export function sectionFor(pathname: string | null | undefined): Section | null {
  if (!pathname) return null
  const path = (pathname.split(/[?#]/)[0] ?? "").replace(/\/+$/, "") || "/"
  let best: Section | null = null
  let bestLength = -1
  for (const section of Object.values(SECTIONS)) {
    for (const prefix of section.prefixes) {
      if ((path === prefix || path.startsWith(`${prefix}/`)) && prefix.length > bestLength) {
        best = section
        bestLength = prefix.length
      }
    }
  }
  return best
}

/** Admission staff (backend `STAFF_ROLES` minus transcript officers): caseload, inbox, KB, consultations. Teachers have no admission access. */
export const CASELOAD_ROLES = ["admin", "counselor", "mentor"] as const
/** Roles that manage deadlines, the catalog and opportunity moderation (mentors only read and comment). */
export const CURATOR_ROLES = ["admin", "counselor"] as const
/** Roles that see documents and transcripts: the caseload roles and transcript officers. */
export const DOCUMENT_ROLES = [...CASELOAD_ROLES, "transcript_officer"] as const

/** Roles that read the comment reports (backend `opportunities:moderate`; staff holding only a grant open the URL). */
export const MODERATOR_ROLES = ["admin"] as const

type RoleList = readonly string[] | undefined
/** Counselors and administrators edit the admission settings (test catalog, readiness weights, career). */
const SETTINGS_ROLES = ["admin", "counselor"] as const
const hasAny = (roles: RoleList, wanted: readonly string[]) => !!roles?.some((role) => wanted.includes(role))

/** A staff member who is not student-capable (no `student` role, not an alumnus): only the staff area and settings. */
export function isStaffOnly(roles: RoleList, alumnus = false): boolean {
  return hasAny(roles, DOCUMENT_ROLES) && !hasAny(roles, ["student"]) && !alumnus
}

/** Neither an applicant nor admission staff (a teacher, an LMS author): the admission app has nothing for them. */
export function hasNoAdmissionAccess(roles: RoleList, alumnus = false): boolean {
  return !hasAny(roles, DOCUMENT_ROLES) && !hasAny(roles, ["student"]) && !alumnus
}

/** The page a signed-in user starts on: transcript officers on their queue, other staff on the caseload. */
export function landingFor(roles: RoleList, alumnus = false): string {
  if (!isStaffOnly(roles, alumnus)) return "/"
  return hasAny(roles, CASELOAD_ROLES) ? "/staff/" : "/staff/transcripts/"
}

/** Sidebar groups and the phone bottom bar. Applicants see the five sections, staff only the staff area. */
export function useNav(): { groups: NavGroup[]; bottom: BottomNavItem[] } {
  const t = useT("nav")
  const { session } = useSession()
  const roles = session?.user.roles
  const alumnus = useIsAlumnus()
  return useMemo(() => {
    const staffOnly = isStaffOnly(roles, alumnus)
    const noAccess = hasNoAdmissionAccess(roles, alumnus)
    const isStaff = hasAny(roles, CASELOAD_ROLES)
    const isCurator = hasAny(roles, CURATOR_ROLES)
    const isDocStaff = hasAny(roles, DOCUMENT_ROLES)
    const settings = { title: t("settings"), url: "/settings/", icon: "settings" } as const
    const secondary = SECONDARY_LINKS.map((link) => ({ title: t(link.id), url: link.url, icon: link.icon }))
    const staffItems: NavGroup["items"] = [
      { title: t("caseload"), url: "/staff/", icon: "teams", match: "exact", visible: isStaff },
      { title: t("inbox"), url: "/staff/inbox/", icon: "inbox", visible: isStaff },
      { title: t("staffDocuments"), url: "/staff/documents/", icon: "files", visible: isDocStaff },
      { title: t("transcripts"), url: "/staff/transcripts/", icon: "page", visible: isDocStaff },
      { title: t("deadlines"), url: "/staff/deadlines/", icon: "calendarEvent", visible: isCurator },
      { title: t("catalog"), url: "/staff/catalog/", icon: "search", visible: isCurator },
      { title: t("exemplars"), url: "/staff/exemplars/", icon: "post", visible: isCurator },
      { title: t("promptStudio"), url: "/staff/prompt-studio/", icon: "sparkles", visible: isCurator },
      {
        title: t("admissionSettings"),
        url: "/staff/settings/",
        icon: "settings",
        visible: hasAny(roles, SETTINGS_ROLES),
      },
      {
        title: t("opportunitiesReview"),
        url: "/staff/opportunities/",
        icon: "moderation",
        match: "exact",
        visible: isCurator,
      },
      {
        title: t("reports"),
        url: "/staff/opportunities/reports/",
        icon: "flag",
        visible: hasAny(roles, MODERATOR_ROLES),
      },
      { title: t("kbEditor"), url: "/staff/kb/", icon: "help", visible: isStaff },
      { title: t("consultationsQueue"), url: "/staff/consultations/", icon: "chat", visible: isStaff },
    ]
    const staffGroup: NavGroup = { label: t("groupStaff"), items: staffItems.filter((item) => item.visible !== false) }
    if (noAccess) {
      return {
        groups: [{ label: t("groupMore"), items: [settings] }],
        bottom: [{ ...settings, title: t("short.settings") }],
      }
    }
    if (staffOnly) {
      const bottom: BottomNavItem[] = [
        ...(isStaff
          ? ([
              { title: t("short.caseload"), url: "/staff/", icon: "teams", match: "exact" },
              { title: t("short.inbox"), url: "/staff/inbox/", icon: "inbox" },
            ] as const)
          : []),
        { title: t("short.staffDocuments"), url: "/staff/documents/", icon: "files" },
        { title: t("short.transcripts"), url: "/staff/transcripts/", icon: "page" },
        { ...settings, title: t("short.settings") },
      ]
      return { groups: [staffGroup, { label: t("groupMore"), items: [settings] }], bottom }
    }
    const sections = SECTION_IDS.map((id) => ({
      title: t(`sections.${id}`),
      url: SECTIONS[id].url,
      icon: SECTIONS[id].icon,
      ...(id === "today" ? { match: "exact" as const } : { matchPrefixes: SECTIONS[id].prefixes }),
    }))
    const groups: NavGroup[] = [
      { items: sections },
      { label: t("groupMore"), items: secondary },
      // Applicants have no staff entries; an empty group would still show its label.
      ...(isDocStaff ? [staffGroup] : []),
    ]
    const bottom: BottomNavItem[] = SECTION_IDS.map((id) => ({
      title: t(`short.${id}`),
      url: SECTIONS[id].url,
      icon: SECTIONS[id].icon,
    }))
    return { groups, bottom }
  }, [t, roles, alumnus])
}
