"use client"

import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { type BottomNavItem, type NavGroup } from "@ihsp/ui"
import { useMemo } from "react"

/** Roles that see the caseload, deadlines and catalog. */
export const CASELOAD_ROLES = ["teacher", "admin", "counselor", "mentor"] as const
/** Roles that see documents and transcripts: the caseload roles and transcript officers. */
export const DOCUMENT_ROLES = [...CASELOAD_ROLES, "transcript_officer"] as const

/** Sidebar groups and the phone bottom bar. Staff entries depend on the staff role. */
export function useNav(): { groups: NavGroup[]; bottom: BottomNavItem[] } {
  const t = useT("nav")
  const { session } = useSession()
  const roles = session?.user.roles
  return useMemo(() => {
    const isStaff = !!roles?.some((role) => (CASELOAD_ROLES as readonly string[]).includes(role))
    const isDocStaff = !!roles?.some((role) => (DOCUMENT_ROLES as readonly string[]).includes(role))
    const home = { title: t("home"), url: "/", icon: "home", match: "exact" } as const
    const profile = { title: t("profile"), url: "/setup/", icon: "profile" } as const
    const activities = { title: t("activities"), url: "/activities/", icon: "sparkles" } as const
    const plans = { title: t("plans"), url: "/plan/", icon: "calendar" } as const
    const universities = { title: t("universities"), url: "/chooser/", icon: "search" } as const
    const documents = { title: t("documents"), url: "/documents/", icon: "files" } as const
    const deadlines = { title: t("deadlines"), url: "/deadlines/", icon: "calendarEvent" } as const
    const groups: NavGroup[] = [
      { label: t("groupSteps"), items: [home, profile, activities, plans, universities, documents, deadlines] },
      {
        label: t("groupMore"),
        items: [
          { title: t("courses"), url: "/courses/", icon: "courses" },
          { title: t("help"), url: "/help/", icon: "help" },
          { title: t("settings"), url: "/settings/", icon: "settings" },
        ],
      },
      {
        label: t("groupStaff"),
        items: [
          { title: t("caseload"), url: "/staff/", icon: "teams", match: "exact", visible: isStaff },
          { title: t("inbox"), url: "/staff/inbox/", icon: "inbox", visible: isStaff },
          { title: t("staffDocuments"), url: "/staff/documents/", icon: "files", visible: isDocStaff },
          { title: t("transcripts"), url: "/staff/transcripts/", icon: "page", visible: isDocStaff },
          { title: t("deadlines"), url: "/staff/deadlines/", icon: "calendarEvent", visible: isStaff },
          { title: t("catalog"), url: "/staff/catalog/", icon: "search", visible: isStaff },
        ],
      },
    ]
    const bottom: BottomNavItem[] = [home, activities, universities, documents]
    return { groups, bottom }
  }, [t, roles])
}
