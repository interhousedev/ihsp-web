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
import { ShellSlotContext } from "./shell-slot"
import { SidebarBottomMenu } from "./sidebar-bottom-menu"
import type { PlatformLink } from "./user-menu"

export type AppShellProps = {
  nav: NavGroup[]
  /** Phone bottom bar (sp, staff). With it the last slot is "More" with the full navigation and the account row. */
  bottomNav?: BottomNavItem[]
  /** A bottom bar of the app's own (replaces `bottomNav`), shown under 768 px; the page gets room for it. */
  bottomBar?: ReactNode
  /** False drops the phone sidebar sheet and its toggle (apps that navigate with their own bottom bar). Default true. */
  mobileSidebar?: boolean
  /** Top of the sidebar: `SidebarBrand` with the logo and the app name. */
  brand?: ReactNode
  /** Back and forward (`ShellNavControls`): the sidebar's first row from 768 px, the start of the top bar on phones. */
  history?: ReactNode
  /** The search entry (`CommandPalette`): beside the history buttons in the sidebar, an icon in the phone top bar. */
  search?: ReactNode
  /** Space for the app's own components between the search row and the navigation (from 768 px). */
  sidebarSlot?: ReactNode
  /** The AI entry (`AssistantEntry`): the sidebar's bottom menu, the phone top bar. */
  ai?: ReactNode
  /** The notification bell: the sidebar's bottom menu, the phone top bar. */
  bell?: ReactNode
  /** The app's own tools (offline badge, sign-in button): the sidebar's bottom menu, the phone top bar. */
  tools?: ReactNode
  /** The app's settings page: a button in the sidebar's bottom menu. */
  settingsHref?: string
  /** The account menu as a round avatar button for the phone top bar. */
  profile?: ReactNode
  /** Bottom of the sidebar: the account row (the profile menu in its `row` variant); also ends the phone "More" sheet. */
  sidebarFooter?: ReactNode
  /** A search field at the top of the phone "More" sheet. */
  moreSearch?: ReactNode
  /** The user's platforms: the sidebar's app switcher and the phone "More" sheet (`usePlatformLinks()`). */
  platforms?: PlatformLink[]
  /** Fixed widgets (help button) rendered outside the animated page wrapper so no transform traps them. */
  floating?: ReactNode
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

/** The compact glass top bar of phones, centred at the top; `Sidebar` carries these controls from 768 px. */
function PhoneControls({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="shell-controls"
      className="glass fixed top-[calc(var(--safe-top)+0.5rem)] left-1/2 z-30 flex h-12 max-w-[calc(100vw-var(--safe-right)-1rem)] -translate-x-1/2 flex-nowrap items-center [&>*]:shrink-0 gap-0.5 rounded-xl p-1 print:hidden"
    >
      <ShellSlotContext.Provider value="bar">{children}</ShellSlotContext.Provider>
    </div>
  )
}

/**
 * The page frame: from 768 px the sidebar carries everything (brand and app switcher, history and search, the app's
 * slot, navigation, bottom menu, account); on phones a sheet plus an optional bottom bar and a compact floating top
 * bar. Content starts under the phone top bar (`--shell-top-reserve`) unless the page holds a `data-shell-flush` element.
 */
export function AppShell({
  nav,
  bottomNav,
  bottomBar,
  mobileSidebar = true,
  brand,
  history,
  search,
  sidebarSlot,
  ai,
  bell,
  tools,
  settingsHref,
  profile,
  sidebarFooter,
  moreSearch,
  platforms,
  floating,
  children,
}: AppShellProps) {
  const t = useT()
  const hasBottomMenu = Boolean(ai || bell || tools || settingsHref)
  return (
    <SidebarProvider>
      <CloseSheetOnNavigate />
      <a
        href="#main-content"
        className="bg-background ring-ring sr-only rounded-full px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:ring-2"
      >
        {t("common.skipToContent")}
      </a>
      <AppSidebar
        nav={nav}
        brand={brand}
        platforms={platforms}
        history={history}
        search={search}
        slot={sidebarSlot}
        bottomMenu={
          hasBottomMenu ? (
            <SidebarBottomMenu bell={bell} ai={ai} settingsHref={settingsHref}>
              {tools}
            </SidebarBottomMenu>
          ) : null
        }
        footer={sidebarFooter}
      />
      <SidebarInset
        id="main-content"
        tabIndex={-1}
        className="min-w-0 scroll-mt-16 [--shell-controls-width:0px] [--shell-top-reserve:calc(var(--safe-top)+4rem)] md:[--shell-top-reserve:var(--safe-top)]"
      >
        <PhoneBar
          mobileSidebar={mobileSidebar}
          hasBottomBar={Boolean(bottomNav || bottomBar)}
          history={history}
          tools={tools}
          search={search}
          ai={ai}
          bell={bell}
          profile={profile}
        />
        <div
          className={cn(
            "page-enter flex min-w-0 flex-1 flex-col pt-(--shell-top-reserve)",
            (bottomNav || bottomBar) &&
              "pb-[calc(var(--bottom-nav-height)+var(--safe-bottom))] [--save-bar-bottom:calc(var(--bottom-nav-height)+var(--safe-bottom)+0.5rem)] md:pb-0 md:[--save-bar-bottom:calc(var(--safe-bottom)+0.5rem)]",
          )}
        >
          {children}
        </div>
        {floating}
        {bottomBar ??
          (bottomNav ? (
            <BottomNav
              items={bottomNav}
              more={nav}
              moreFooter={sidebarFooter}
              moreSearch={moreSearch}
              platforms={platforms}
            />
          ) : null)}
      </SidebarInset>
    </SidebarProvider>
  )
}

/** The phone top bar: the sheet toggle, history, the app's tools, search, the assistant, the bell and the avatar. */
function PhoneBar({
  mobileSidebar,
  hasBottomBar,
  history,
  tools,
  search,
  ai,
  bell,
  profile,
}: {
  mobileSidebar: boolean
  hasBottomBar: boolean
  history: ReactNode
  tools: ReactNode
  search: ReactNode
  ai: ReactNode
  bell: ReactNode
  profile: ReactNode
}) {
  const { isMobile } = useSidebar()
  if (!isMobile) return null
  return (
    <PhoneControls>
      <PhoneSidebarTrigger mobileSidebar={mobileSidebar} hasBottomBar={hasBottomBar} />
      {history}
      {history && (tools || search || ai || bell || profile) ? (
        <Separator orientation="vertical" className="mx-0.5 h-5 data-vertical:self-center" />
      ) : null}
      {tools}
      {search}
      {ai}
      {bell}
      {profile}
    </PhoneControls>
  )
}
