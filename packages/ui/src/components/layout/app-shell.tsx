"use client"

import { useT } from "@ihsp/i18n"
import { usePathname } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { cn } from "../../lib/utils"
import { Separator } from "../ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "../ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { BottomNav } from "./bottom-nav"
import type { BottomNavItem, NavGroup } from "./nav-types"

export type AppShellProps = {
  nav: NavGroup[]
  /** Phone bottom bar (sp, staff). With it the last slot is "More" with the full navigation. */
  bottomNav?: BottomNavItem[]
  /** Right side of the top bar: search, notification bell, profile menu. */
  header?: ReactNode
  /** Top of the sidebar: logo and app name. */
  brand?: ReactNode
  /** Bottom of the sidebar: the user block. */
  sidebarFooter?: ReactNode
  children: ReactNode
}

/** Closes the phone sheet after a navigation. */
function CloseSheetOnNavigate() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])
  return null
}

/**
 * The page frame: sidebar from 768 px, a sheet plus an optional bottom bar on phones, safe-area insets
 * (notches and Telegram's header) applied to the top bar and the bottom bar.
 */
export function AppShell({ nav, bottomNav, header, brand, sidebarFooter, children }: AppShellProps) {
  const t = useT()
  return (
    <SidebarProvider>
      <CloseSheetOnNavigate />
      <a
        href="#main-content"
        className="bg-background ring-ring sr-only rounded-md px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:ring-2"
      >
        {t("common.skipToContent")}
      </a>
      <AppSidebar nav={nav} brand={brand} footer={sidebarFooter} />
      <SidebarInset id="main-content" tabIndex={-1} className="min-w-0 scroll-mt-16">
        <header className="bg-background/80 sticky top-0 z-20 flex shrink-0 items-center justify-between gap-2 px-3 pt-[var(--safe-top)] backdrop-blur-md md:px-4">
          <div className="flex h-14 items-center gap-2 md:h-14">
            <SidebarTrigger className="-ml-1 size-11 md:size-8" aria-label={t("nav.toggleSidebar")} />
            <Separator orientation="vertical" className="mr-1 hidden h-4 data-vertical:self-center md:block" />
          </div>
          <div className="flex h-14 min-w-0 items-center gap-2">{header}</div>
        </header>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            bottomNav && "pb-[calc(var(--bottom-nav-height)+var(--safe-bottom))] md:pb-0",
          )}
        >
          {children}
        </div>
        {bottomNav ? <BottomNav items={bottomNav} more={nav} /> : null}
      </SidebarInset>
    </SidebarProvider>
  )
}
