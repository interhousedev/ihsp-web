"use client"

import { useT } from "@ihsp/i18n"
import { usePathname } from "next/navigation"
import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "../../lib/utils"
import { Separator } from "../ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "../ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { BottomNav } from "./bottom-nav"
import type { BottomNavItem, NavGroup } from "./nav-types"

export type AppShellProps = {
  nav: NavGroup[]
  /** Phone bottom bar (sp, staff). With it the last slot is "More" with the full navigation and the account row. */
  bottomNav?: BottomNavItem[]
  /** A bottom bar of the app's own (replaces `bottomNav`), shown under 768 px; the page gets room for it. */
  bottomBar?: ReactNode
  /** False drops the phone sidebar sheet and its toggle (apps that navigate with their own bottom bar). Default true. */
  mobileSidebar?: boolean
  /** End of the floating controls: search, notification bell. */
  controls?: ReactNode
  /** Start of the floating controls: history back/forward and the platform menu. */
  controlsLeading?: ReactNode
  /** Top of the sidebar: `SidebarBrand` with the logo and the app name. */
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
 * The phone sheet's toggle; from 768 px the logo in the sidebar is the toggle. Not rendered with `mobileSidebar` off
 * (there is no sheet to open) or when a bottom bar is shown: its "More" is the one overflow menu on phones.
 */
function PhoneSidebarTrigger({ mobileSidebar, hasBottomBar }: { mobileSidebar: boolean; hasBottomBar: boolean }) {
  const t = useT()
  const { isMobile } = useSidebar()
  if (!isMobile || !mobileSidebar || hasBottomBar) return null
  return <SidebarTrigger className="size-11" aria-label={t("nav.toggleSidebar")} />
}

/**
 * The floating glass controls in the top end corner. Their measured width goes to `--shell-controls-width` on the
 * inset, so page headers in the same row keep clear of them whatever the app put inside.
 */
function FloatingControls({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    const inset = element?.closest<HTMLElement>('[data-slot="sidebar-inset"]')
    if (!element || !inset || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      inset.style.setProperty("--shell-controls-width", `${Math.ceil(element.offsetWidth) + 16}px`)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      data-slot="shell-controls"
      className="glass fixed end-[calc(var(--safe-right)+0.5rem)] top-[calc(var(--safe-top)+0.5rem)] z-30 flex max-w-[calc(100vw-var(--safe-right)-1rem)] items-center gap-0.5 rounded-xl p-1 print:hidden"
    >
      {children}
    </div>
  )
}

/**
 * The page frame: sidebar from 768 px, a sheet plus an optional bottom bar on phones, floating controls in the top end
 * corner. Content starts under the controls (`--shell-top-reserve`) unless the page holds a `data-shell-flush` element:
 * from 768 px such a page takes the controls' row and keeps its own end clear with `--shell-controls-width`.
 */
export function AppShell({
  nav,
  bottomNav,
  bottomBar,
  mobileSidebar = true,
  controls,
  brand,
  sidebarFooter,
  controlsLeading,
  children,
}: AppShellProps) {
  const t = useT()
  return (
    <SidebarProvider>
      <CloseSheetOnNavigate />
      <a
        href="#main-content"
        className="bg-background ring-ring sr-only rounded-full px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:ring-2"
      >
        {t("common.skipToContent")}
      </a>
      <AppSidebar nav={nav} brand={brand} footer={sidebarFooter} />
      <SidebarInset
        id="main-content"
        tabIndex={-1}
        className="min-w-0 scroll-mt-16 [--shell-controls-width:16rem] [--shell-top-reserve:calc(var(--safe-top)+4rem)] md:[--shell-top-reserve:calc(var(--safe-top)+3.5rem)]"
      >
        <FloatingControls>
          <PhoneSidebarTrigger mobileSidebar={mobileSidebar} hasBottomBar={Boolean(bottomNav || bottomBar)} />
          {controlsLeading}
          {controlsLeading && controls ? (
            <Separator orientation="vertical" className="mx-0.5 h-5 data-vertical:self-center" />
          ) : null}
          {controls}
        </FloatingControls>
        <div
          className={cn(
            "page-enter flex min-w-0 flex-1 flex-col pt-(--shell-top-reserve) md:has-[[data-shell-flush]]:pt-(--safe-top)",
            (bottomNav || bottomBar) && "pb-[calc(var(--bottom-nav-height)+var(--safe-bottom))] md:pb-0",
          )}
        >
          {children}
        </div>
        {bottomBar ?? (bottomNav ? <BottomNav items={bottomNav} more={nav} moreFooter={sidebarFooter} /> : null)}
      </SidebarInset>
    </SidebarProvider>
  )
}
