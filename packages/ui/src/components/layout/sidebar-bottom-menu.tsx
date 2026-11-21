"use client"

import { useT } from "@ihsp/i18n"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { cn } from "../../lib/utils"
import { Icons } from "../icons"
import { buttonVariants } from "../ui/button"
import { isActivePath } from "./nav-types"

/**
 * The tool row pinned to the bottom of the sidebar, above the account row: notifications, the assistant, settings and
 * the app's own tools (offline badge, sign-in). A row when the panel is open, a column in the icon rail.
 */
export function SidebarBottomMenu({
  bell,
  ai,
  settingsHref,
  children,
}: {
  bell?: ReactNode
  ai?: ReactNode
  /** The app's settings page. */
  settingsHref?: string
  /** The app's own tools. */
  children?: ReactNode
}) {
  const t = useT()
  const pathname = usePathname()
  const settingsActive = settingsHref ? isActivePath(pathname, settingsHref) : false
  return (
    <div
      role="group"
      data-slot="sidebar-bottom-menu"
      aria-label={t("nav.accountTools")}
      className="flex flex-wrap items-center gap-0.5 group-data-[collapsible=icon]:flex-col"
    >
      {bell}
      {ai}
      {settingsHref ? (
        <Link
          href={settingsHref}
          aria-label={t("nav.settings")}
          aria-current={settingsActive ? "page" : undefined}
          data-slot="sidebar-settings"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "size-8 shrink-0",
            settingsActive && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          <Icons.settings aria-hidden />
        </Link>
      ) : null}
      {children}
    </div>
  )
}
