"use client"

import { useT } from "@ihsp/i18n"
import type { NavGroup } from "@ihsp/ui"
import { useMemo } from "react"

/**
 * Sidebar of the admin app: Home, People, Academics, Reports, Operations, Communication, Tools.
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
            { title: t("teachers"), url: "/teachers/", icon: "userPen" },
            { title: t("users"), url: "/users/", icon: "account" },
            { title: t("loginCues"), url: "/login-cues/", icon: "login" },
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
            { title: t("exams"), url: "/exams/", icon: "exams" },
            { title: t("knowledge"), url: "/knowledge/", icon: "library" },
          ],
        },
        {
          label: t("groupReports"),
          items: [
            { title: t("attendance"), url: "/attendance/", icon: "attendance" },
            { title: t("workOffs"), url: "/work-offs/", icon: "homework" },
            { title: t("excuses"), url: "/excuses/", icon: "mail" },
            { title: t("reports"), url: "/reports/", icon: "reports" },
            { title: t("certificates"), url: "/certificates/", icon: "certificates" },
            { title: t("certificateTypes"), url: "/certificate-types/", icon: "forms" },
          ],
        },
        {
          label: t("groupOperations"),
          items: [
            { title: t("monitoring"), url: "/monitoring/", icon: "monitoring" },
            { title: t("logs"), url: "/logs/", icon: "warning" },
            { title: t("mcpActivity"), url: "/mcp-activity/", icon: "connectors" },
            { title: t("limits"), url: "/limits/", icon: "adjustments" },
            { title: t("devices"), url: "/devices/", icon: "laptop" },
            { title: t("vault"), url: "/vault/", icon: "lock" },
          ],
        },
        {
          label: t("groupCommunication"),
          items: [{ title: t("broadcasts"), url: "/broadcasts/", icon: "broadcasts" }],
        },
        {
          label: t("groupTools"),
          items: [
            { title: t("botPosts"), url: "/bot-posts/", icon: "post" },
            { title: t("moderation"), url: "/moderation/", icon: "moderation" },
            { title: t("callForImprovements"), url: "/call-for-improvements/", icon: "chat" },
            { title: t("assistant"), url: "/assistant/", icon: "assistant" },
            { title: t("settings"), url: "/settings/", icon: "settings" },
          ],
        },
      ],
    }),
    [t],
  )
}
