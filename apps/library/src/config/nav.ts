"use client"

import { useLibraryAccess } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { filterNavGroups, type BottomNavItem, type NavGroup } from "@ihsp/ui"
import { IconBookmarks, IconBooks, IconCategory, IconFlag, IconInbox, IconListDetails } from "@ihsp/ui"
import { useMemo } from "react"

/**
 * Sidebar groups and the phone bottom bar (Home, Browse, My library, then "More" from the shell). Titles are translated
 * here, so the hook runs in a component. Visitors see only the public entries; `AppShell` does not filter by role, so
 * the hook does it with the session roles.
 */
export function useNav(): { groups: NavGroup[]; bottom: BottomNavItem[] } {
  const t = useT("nav")
  const { signedIn, roles, canManage, isAdmin } = useLibraryAccess()
  return useMemo(() => {
    const home = { title: t("home"), url: "/", icon: "home", match: "exact" } as const
    const browse = { title: t("browse"), url: "/browse/", icon: IconBooks } as const
    const my = { title: t("my"), url: "/my/", icon: IconBookmarks, visible: signedIn } as const
    const groups: NavGroup[] = [
      {
        label: t("groupLibrary"),
        items: [home, browse, { title: t("lists"), url: "/lists/", icon: IconListDetails, visible: signedIn }],
      },
      {
        label: t("groupMine"),
        items: [my, { title: t("upload"), url: "/upload/", icon: "upload", visible: signedIn }],
      },
      {
        label: t("groupManage"),
        items: [
          { title: t("queue"), url: "/manage/queue/", icon: IconInbox, visible: canManage },
          { title: t("books"), url: "/manage/books/", icon: IconBooks, visible: canManage },
          { title: t("topics"), url: "/manage/topics/", icon: IconCategory, visible: canManage },
          {
            title: t("manageCollections"),
            url: "/manage/collections/",
            icon: "galleryVerticalEnd",
            visible: canManage,
          },
          { title: t("reports"), url: "/manage/reports/", icon: IconFlag, visible: canManage },
          { title: t("stats"), url: "/manage/stats/", icon: "reports", visible: canManage },
          { title: t("unilibrary"), url: "/manage/unilibrary/", icon: "globe", visible: isAdmin },
        ],
      },
    ]
    const bottom: BottomNavItem[] = [home, browse]
    if (signedIn) bottom.push({ title: t("my"), url: "/my/", icon: IconBookmarks })
    return { groups: filterNavGroups(groups, roles), bottom }
  }, [t, signedIn, roles, canManage, isAdmin])
}
