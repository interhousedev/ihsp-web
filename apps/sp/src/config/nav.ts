"use client"

import { useT } from "@ihsp/i18n"
import type { BottomNavItem, NavGroup } from "@ihsp/ui"
import { IconUserCircle } from "@ihsp/ui"
import { useMemo } from "react"
import { SETTINGS_GROUPS, settingsGroupHref } from "@/features/settings/components/settings-groups"

/**
 * Sidebar groups and the phone bottom bar (WEB-2): Home, Academics, Study tools (pages by the study-tools task),
 * Inbox and Account. The calendar (`/timetable/`, titled Timetable) also holds the attendance. Home (`/`) is the landing
 * page and the only widget grid; `/today/` redirects there. The bar has Home, Calendar, Grades and Homework; "More" is
 * added by the shell.
 */
export function useNav(): { groups: NavGroup[]; bottom: BottomNavItem[]; search: NavGroup[] } {
  const t = useT("nav")
  const tProfile = useT("profile")
  const tFace = useT("face")
  const tSettings = useT("settings")
  return useMemo(() => {
    const dashboard = { title: t("dashboard"), url: "/", icon: "dashboard", match: "exact" } as const
    const timetable = { title: t("timetable"), url: "/timetable/", icon: "timetable" } as const
    const grades = { title: t("grades"), url: "/grades/", icon: "grades" } as const
    const homework = { title: t("homework"), url: "/homework/", icon: "homework" } as const
    return {
      groups: [
        { items: [dashboard] },
        {
          label: t("groupAcademics"),
          items: [
            timetable,
            { title: t("subjects"), url: "/subjects/", icon: "subjects" },
            grades,
            homework,
            { title: t("exams"), url: "/exams/", icon: "exams" },
            { title: t("excuses"), url: "/excuses/", icon: "checks" },
            { title: t("teachers"), url: "/teachers/", icon: IconUserCircle },
            { title: t("myGroup"), url: "/my-group/", icon: "groups" },
            { title: t("activities"), url: "/activities/", icon: "pin" },
            { title: t("rating"), url: "/rating/", icon: "trophy" },
          ],
        },
        {
          label: t("groupStudyTools"),
          items: [
            { title: t("assistant"), url: "/assistant/", icon: "sparkles" },
            { title: t("notebooks"), url: "/notebooks/", icon: "notebooks" },
            { title: t("flashcards"), url: "/flashcards/", icon: "flashcards" },
            { title: t("files"), url: "/files/", icon: "files" },
            { title: t("links"), url: "/links/", icon: "links" },
          ],
        },
        {
          label: t("groupInbox"),
          items: [
            { title: t("notifications"), url: "/notifications/", icon: "notification" },
            { title: t("mail"), url: "/mail/", icon: "mail" },
          ],
        },
        {
          label: t("groupAccount"),
          items: [{ title: t("settings"), url: "/settings/", icon: "settings" }],
        },
      ],
      bottom: [dashboard, timetable, grades, homework],
      // Pages that are not in the sidebar but must be found by the command palette (pass `[...groups, ...search]`).
      search: [
        {
          items: [
            { title: tProfile("title"), url: "/profile/", icon: "profile" },
            { title: tProfile("photo.title"), url: "/profile/#photo", icon: "camera" },
            { title: tFace("title"), url: "/profile/face/", icon: "attendance" },
            { title: tProfile("accountLink"), url: "/profile/account/", icon: "lock" },
            ...SETTINGS_GROUPS.map((group) => ({
              title: `${t("settings")} · ${tSettings(`groups.${group.id}.title`)}`,
              url: settingsGroupHref(group.id),
              icon: group.icon,
            })),
          ],
        },
      ],
    }
  }, [t, tProfile, tFace, tSettings])
}
