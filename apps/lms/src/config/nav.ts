"use client"

import { useSession } from "@ihsp/auth"
import { filterNavGroups, type BottomNavItem, type NavGroup } from "@ihsp/ui"
import { useT } from "@ihsp/i18n"
import { useMemo } from "react"

/**
 * Sidebar groups and the phone bottom bar. Titles are translated here, so the hook runs in a component.
 * "Create course" is shown to LMS admins and course creators only: `AppShell` does not filter by role, so the hook does it with the session roles.
 * The bottom bar gets "More" from the shell.
 */
export function useNav(): { groups: NavGroup[]; bottom: BottomNavItem[] } {
  const t = useT("nav")
  const { session } = useSession()
  const roles = session?.user.roles
  return useMemo(() => {
    const catalog = { title: t("catalog"), url: "/", icon: "courses", match: "exact" } as const
    const my = { title: t("my"), url: "/my/", icon: "subjects" } as const
    const notebooks = { title: t("notebooks"), url: "/notebooks/", icon: "notebooks" } as const
    const join = { title: t("join"), url: "/join/", icon: "links" } as const
    const groups: NavGroup[] = [
      { label: t("groupLearn"), items: [catalog, my, notebooks, join] },
      {
        label: t("groupManage"),
        items: [{ title: t("admin"), url: "/admin/", icon: "settings", roles: ["lms_admin", "lms_creator"] }],
      },
    ]
    return { groups: filterNavGroups(groups, roles ?? []), bottom: [catalog, my, join] }
  }, [t, roles])
}
