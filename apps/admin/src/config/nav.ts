"use client"

import { useT } from "@ihsp/i18n"
import type { NavGroup } from "@ihsp/ui"
import { useMemo } from "react"

/**
 * Sidebar of the admin app, as in the spec table: Home, People, Academics, Reports, Communication, Tools.
 * Administration works on a desktop or a tablet, so there is no phone bottom bar; the sidebar opens as a sheet.
 */
export function useNav(): { groups: NavGroup[] } {
  const t = useT("nav")
  return useMemo(
    () => ({
      groups: [
        { label: t("groupHome"), items: [{ title: t("dashboard"), url: "/", icon: "dashboard", match: "exact" }] },
        {
          label: t("groupPeople"),
          items: [
            { title: t("students"), url: "/students/", icon: "students" },
            { title: t("teachers"), url: "/teachers/", icon: "user" },
            { title: t("users"), url: "/users/", icon: "account" },
          ],
        },
        {
          label: t("groupAcademics"),
          items: [
            { title: t("groups"), url: "/groups/", icon: "groups" },
            { title: t("subjects"), url: "/subjects/", icon: "subjects" },
            { title: t("rooms"), url: "/rooms/", icon: "rooms" },
            { title: t("terms"), url: "/terms/", icon: "terms" },
            { title: t("timetable"), url: "/timetable/", icon: "timetable" },
            { title: t("lessons"), url: "/lessons/", icon: "calendarEvent" },
            { title: t("exams"), url: "/exams/", icon: "forms" },
            { title: t("knowledge"), url: "/knowledge/", icon: "library" },
            { title: t("certificateTypes"), url: "/certificate-types/", icon: "settings" },
          ],
        },
        {
          label: t("groupReports"),
          items: [
            { title: t("attendance"), url: "/attendance/", icon: "attendance" },
            { title: t("workOffs"), url: "/work-offs/", icon: "homework" },
            { title: t("reports"), url: "/reports/", icon: "reports" },
            { title: t("certificates"), url: "/certificates/", icon: "grades" },
            { title: t("monitoring"), url: "/monitoring/", icon: "monitoring" },
            { title: t("logs"), url: "/logs/", icon: "warning" },
          ],
        },
        {
          label: t("groupCommunication"),
          items: [{ title: t("broadcasts"), url: "/broadcasts/", icon: "broadcasts" }],
        },
        {
          label: t("groupTools"),
          items: [
            { title: t("moderation"), url: "/moderation/", icon: "moderation" },
            { title: t("assistant"), url: "/assistant/", icon: "assistant" },
            { title: t("limits"), url: "/limits/", icon: "adjustments" },
            { title: t("settings"), url: "/settings/", icon: "settings" },
          ],
        },
      ],
    }),
    [t],
  )
}
