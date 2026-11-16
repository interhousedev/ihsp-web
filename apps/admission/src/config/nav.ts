"use client"

import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { type BottomNavItem, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"

/** Roles that see the caseload, deadlines and catalog. */
export const CASELOAD_ROLES = ["teacher", "admin", "counselor", "mentor"] as const
/** Roles that manage deadlines, the catalog and opportunity moderation (mentors only read and comment). */
export const CURATOR_ROLES = ["teacher", "admin", "counselor"] as const
/** Roles that see documents and transcripts: the caseload roles and transcript officers. */
export const DOCUMENT_ROLES = [...CASELOAD_ROLES, "transcript_officer"] as const

type RoleList = readonly string[] | undefined
/** Counselors and administrators edit the admission settings (test catalog, readiness weights, career). */
const SETTINGS_ROLES = ["admin", "counselor"] as const
const hasAny = (roles: RoleList, wanted: readonly string[]) => !!roles?.some((role) => wanted.includes(role))

/** A staff member without the student role: no applicant pages, only the staff area and settings. */
export function isStaffOnly(roles: RoleList): boolean {
  return hasAny(roles, DOCUMENT_ROLES) && !hasAny(roles, ["student"])
}

/** The page a signed-in user starts on: transcript officers on their queue, other staff on the caseload. */
export function landingFor(roles: RoleList): string {
  if (!isStaffOnly(roles)) return "/"
  return hasAny(roles, CASELOAD_ROLES) ? "/staff/" : "/staff/transcripts/"
}

/** Sidebar groups and the phone bottom bar. Applicants see the application, staff only the staff area. */
export function useNav(): { groups: NavGroup[]; bottom: BottomNavItem[] } {
  const t = useT("nav")
  const { session } = useSession()
  const roles = session?.user.roles
  return useMemo(() => {
    const staffOnly = isStaffOnly(roles)
    const isStaff = hasAny(roles, CASELOAD_ROLES)
    const isCurator = hasAny(roles, CURATOR_ROLES)
    const isDocStaff = hasAny(roles, DOCUMENT_ROLES)
    const home = { title: t("home"), url: "/", icon: "home", match: "exact" } as const
    const journey = { title: t("journey"), url: "/journey/", icon: "route" } as const
    const profile = { title: t("profile"), url: "/setup/", icon: "profile" } as const
    const activities = { title: t("activities"), url: "/activities/", icon: "sparkles" } as const
    const plans = { title: t("plans"), url: "/plan/", icon: "calendar" } as const
    const tasks = { title: t("tasks"), url: "/tasks/", icon: "kanban" } as const
    const universities = { title: t("universities"), url: "/chooser/", icon: "search" } as const
    const discover = { title: t("discover"), url: "/colleges/discover/", icon: "discover" } as const
    const essays = { title: t("essays"), url: "/essays/", icon: "post" } as const
    const documents = { title: t("documents"), url: "/documents/", icon: "files" } as const
    const settings = { title: t("settings"), url: "/settings/", icon: "settings" } as const
    const staffItems: NavGroup["items"] = [
      { title: t("caseload"), url: "/staff/", icon: "teams", match: "exact", visible: isStaff },
      { title: t("inbox"), url: "/staff/inbox/", icon: "inbox", visible: isStaff },
      { title: t("staffDocuments"), url: "/staff/documents/", icon: "files", visible: isDocStaff },
      { title: t("transcripts"), url: "/staff/transcripts/", icon: "page", visible: isDocStaff },
      { title: t("deadlines"), url: "/staff/deadlines/", icon: "calendarEvent", visible: isCurator },
      { title: t("catalog"), url: "/staff/catalog/", icon: "search", visible: isCurator },
      {
        title: t("admissionSettings"),
        url: "/staff/settings/",
        icon: "settings",
        visible: hasAny(roles, SETTINGS_ROLES),
      },
      { title: t("opportunitiesReview"), url: "/staff/opportunities/", icon: "moderation", visible: isCurator },
    ]
    const staffGroup: NavGroup = { label: t("groupStaff"), items: staffItems.filter((item) => item.visible !== false) }
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
    const review = { title: t("review"), url: "/review/", icon: "sparkles" } as const
    const groups: NavGroup[] = [
      {
        label: t("groupSteps"),
        items: [home, journey, profile, activities, plans, tasks, universities, discover, essays, documents, review],
      },
      {
        label: t("groupMore"),
        items: [
          { title: t("career"), url: "/career/", icon: "sparkles" },
          { title: t("opportunities"), url: "/opportunities/", icon: "exams" },
          { title: t("tests"), url: "/tests/", icon: "certificates" },
          { title: t("courses"), url: "/courses/", icon: "courses" },
          { title: t("help"), url: "/help/", icon: "help" },
          settings,
        ],
      },
      // Applicants have no staff entries; an empty group would still show its label.
      ...(isDocStaff ? [staffGroup] : []),
    ]
    const bottom: BottomNavItem[] = [
      { ...home, title: t("short.home") },
      { ...activities, title: t("short.activities") },
      { ...universities, title: t("short.universities") },
      { ...documents, title: t("short.documents") },
    ]
    return { groups, bottom }
  }, [t, roles])
}
