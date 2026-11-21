"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { Icons } from "../icons"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "../ui/sidebar"
import { NavIconView } from "./nav-icon"
import { isActivePath, type NavGroup, type NavItem } from "./nav-types"
import { PlatformMenu } from "./platform-menu"
import { ShellSlotContext } from "./shell-slot"
import type { PlatformLink } from "./user-menu"

/**
 * Geometry shared by every nav row, expanded and collapsed: the icon is the first child and never moves (the row keeps
 * its `p-2` and the icon its `size-4`). The label is one line, clipped and faded when the rail is collapsed, so it
 * never wraps while the sidebar animates and never pushes the icon.
 */
const LABEL_CLASS = "min-w-0 flex-1 truncate transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0"

function NavLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const active = isActivePath(pathname, item.url, item.match, item.matchPrefixes)
  const link = item.external ? (
    <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={item.title} />
  ) : (
    <Link href={item.url} aria-label={item.title} aria-current={active ? "page" : undefined} />
  )
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={link}
        tooltip={item.title}
        isActive={active}
        aria-disabled={item.disabled}
        className="max-md:min-h-11"
      >
        <NavIconView icon={item.icon} />
        <span className={LABEL_CLASS}>{item.title}</span>
      </SidebarMenuButton>
      {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
    </SidebarMenuItem>
  )
}

function NavBranch({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const active = isActivePath(pathname, item.url, item.match, item.matchPrefixes)
  return (
    <Collapsible defaultOpen={active} render={<SidebarMenuItem />}>
      <CollapsibleTrigger
        render={<SidebarMenuButton tooltip={item.title} isActive={active} className="group/collapsible" />}
      >
        <NavIconView icon={item.icon} />
        <span className={LABEL_CLASS}>{item.title}</span>
        <Icons.chevronRight className="shrink-0 transition-transform duration-200 group-data-panel-open/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.items?.map((child) => (
            <SidebarMenuSubItem key={child.url}>
              <SidebarMenuSubButton
                render={<Link href={child.url} aria-label={child.title} />}
                isActive={isActivePath(pathname, child.url, child.match)}
              >
                <span>{child.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

export type AppSidebarProps = {
  nav: NavGroup[]
  /** Top of the panel: `SidebarBrand` with the logo and the app name. */
  brand?: ReactNode
  /** The user's platforms: the app switcher beside the brand. */
  platforms?: PlatformLink[]
  /** Back and forward, first in the row under the brand (desktop panel only). */
  history?: ReactNode
  /** The search button, after the history buttons (desktop panel only). */
  search?: ReactNode
  /** Space for the app's own components between the search row and the navigation (desktop panel only). */
  slot?: ReactNode
  /** The tool row above the account row (desktop panel only). */
  bottomMenu?: ReactNode
  /** The account row at the bottom; in the phone sheet it is the only footer. */
  footer?: ReactNode
}

/**
 * The side navigation. From 768 px a floating glass panel (a pill of circular icon buttons when collapsed), top to
 * bottom: the brand with the app switcher, the history and search row, the app's slot, the navigation, then the pinned
 * bottom menu and the account row. On phones the sheet holds the brand, the navigation and the account row only; the
 * rest lives in the phone top bar.
 */
export function AppSidebar({ nav, brand, platforms = [], history, search, slot, bottomMenu, footer }: AppSidebarProps) {
  const pathname = usePathname()
  const { isMobile } = useSidebar()
  const desktop = !isMobile
  const hasToolbar = desktop && Boolean(history || search)
  return (
    <Sidebar collapsible="icon" variant="floating">
      {brand ? (
        <SidebarHeader>
          <div className="flex items-center gap-1">
            <div className="min-w-0 flex-1">{brand}</div>
            {desktop ? (
              <div className="group-data-[collapsible=icon]:hidden">
                <PlatformMenu platforms={platforms} />
              </div>
            ) : null}
          </div>
          {hasToolbar ? (
            <ShellSlotContext.Provider value="sidebar">
              <div
                data-slot="sidebar-toolbar"
                className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:[&_[data-slot=history-buttons]]:flex-col"
              >
                {history}
                {search}
              </div>
            </ShellSlotContext.Provider>
          ) : null}
        </SidebarHeader>
      ) : null}
      {desktop && slot ? (
        <div data-slot="sidebar-slot" className="px-2 group-data-[collapsible=icon]:hidden">
          {slot}
        </div>
      ) : null}
      <SidebarContent className="overflow-x-hidden">
        {nav.map((group, index) => (
          <SidebarGroup key={group.label ?? `group-${index}`} className="py-0">
            {/* The label keeps its h-8 slot when collapsed (text faded), so every row sits at the same y. */}
            {group.label ? (
              <SidebarGroupLabel className="group-data-[collapsible=icon]:mt-0">
                <span className="min-w-0 truncate">{group.label}</span>
              </SidebarGroupLabel>
            ) : null}
            <SidebarMenu>
              {group.items.map((item) =>
                item.items && item.items.length > 0 ? (
                  <NavBranch key={item.url} item={item} pathname={pathname} />
                ) : (
                  <NavLink key={item.url} item={item} pathname={pathname} />
                ),
              )}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {(desktop && bottomMenu) || footer ? (
        <SidebarFooter data-slot="sidebar-account" className="border-t border-hairline">
          {desktop && bottomMenu ? (
            <ShellSlotContext.Provider value="sidebar">{bottomMenu}</ShellSlotContext.Provider>
          ) : null}
          {footer}
        </SidebarFooter>
      ) : null}
      <SidebarRail />
    </Sidebar>
  )
}
