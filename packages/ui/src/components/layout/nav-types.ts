import type { ComponentType, ReactNode } from "react"
import type { Icons } from "../icons"

export type IconName = keyof typeof Icons
export type IconComponent = ComponentType<{ className?: string }>
/** A name from the shared `Icons` registry or any icon component (for example an `Icon*` component exported by the ui icons registry). */
export type NavIcon = IconName | IconComponent

export type NavItem = {
  /** Already translated text (build the nav in a hook with `useT()`). */
  title: string
  url: string
  icon?: NavIcon
  /** `prefix` (default): active on the URL and its sub-pages; `exact`: only on the URL. */
  match?: "exact" | "prefix"
  /** Shown only to users who have at least one of these roles; no `roles` means everyone. */
  roles?: readonly string[]
  /** Hidden when false (for example "My group" when the teacher curates no group). */
  visible?: boolean
  external?: boolean
  disabled?: boolean
  badge?: ReactNode
  items?: NavItem[]
}

export type NavGroup = {
  /** Already translated group heading; no label renders the items without a heading. */
  label?: string
  items: NavItem[]
}

export type BottomNavItem = {
  title: string
  url: string
  icon: NavIcon
  match?: "exact" | "prefix"
  /** Unread counter or similar. */
  badge?: number
}

/** Path without query, hash or trailing slash (`/timetable/?week=1` → `/timetable`). The root stays `/`. */
export function normalizePath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? ""
  const trimmed = withoutQuery.replace(/\/+$/, "")
  return trimmed === "" ? "/" : trimmed
}

export function isActivePath(pathname: string | null, url: string, match: "exact" | "prefix" = "prefix"): boolean {
  if (pathname === null) return false
  const current = normalizePath(pathname)
  const target = normalizePath(url)
  if (current === target) return true
  if (match === "exact" || target === "/") return false
  return current.startsWith(`${target}/`)
}

function isVisibleTo(item: NavItem, userRoles: readonly string[]): boolean {
  if (item.visible === false) return false
  if (!item.roles || item.roles.length === 0) return true
  return item.roles.some((role) => userRoles.includes(role))
}

/** Drops items the user may not see (by `roles` and `visible`) and groups that end up empty. */
export function filterNavGroups(groups: NavGroup[], userRoles: readonly string[]): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => isVisibleTo(item, userRoles))
        .map((item) =>
          item.items ? { ...item, items: item.items.filter((child) => isVisibleTo(child, userRoles)) } : item,
        ),
    }))
    .filter((group) => group.items.length > 0)
}
