"use client"

import { useT } from "@ihsp/i18n"
import type { BottomNavItem, NavGroup } from "@ihsp/ui"
import { IconNotebook } from "@ihsp/ui"
import { useMemo } from "react"
import { useCuratedGroups } from "../features/shell/hooks/use-curated-groups"

/**
 * Sidebar groups and the phone bottom bar (STF area table): Home, Teaching, My group (only for curators), Inbox and
 * Settings. The bar has Today, Timetable, Journal and My group; "More" is added by the shell.
 */
export function useNav(): { groups: NavGroup[]; bottom: BottomNavItem[] } {
  const t = useT("nav")
  const { isCurator } = useCuratedGroups()
  return useMemo(() => {
    const today = { title: t("today"), url: "/", icon: "today", match: "exact" } as const
    const timetable = { title: t("timetable"), url: "/timetable/", icon: "timetable" } as const
    const journal = { title: t("journal"), url: "/journal/", icon: "journal" } as const
    const exams = { title: t("exams"), url: "/group/exams/", icon: "calendarEvent" } as const
    const studentSearch = { title: t("studentSearch"), url: "/students/", icon: "search" } as const
    const notebooks = { title: t("notebooks"), url: "/notebooks/", icon: IconNotebook } as const
    const groups: NavGroup[] = [
      { label: t("groupHome"), items: [today] },
      { label: t("groupTeaching"), items: [timetable, journal, studentSearch, notebooks, exams] },
    ]
    if (isCurator) {
      groups.push({
        label: t("groupMyGroup"),
        items: [
          { title: t("students"), url: "/group/", icon: "students", match: "exact" },
          { title: t("subgroups"), url: "/group/subgroups/", icon: "groups" },
          { title: t("groupAttendance"), url: "/group/attendance/", icon: "attendance" },
        ],
      })
    }
    groups.push(
      { label: t("groupInbox"), items: [{ title: t("notifications"), url: "/notifications/", icon: "notification" }] },
      { label: t("groupSettings"), items: [{ title: t("settings"), url: "/settings/", icon: "settings" }] },
    )
    const bottom: BottomNavItem[] = [today, timetable, journal]
    if (isCurator) bottom.push({ title: t("myGroup"), url: "/group/", icon: "students" })
    return { groups, bottom }
  }, [t, isCurator])
}
