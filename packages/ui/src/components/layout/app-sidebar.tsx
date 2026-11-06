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
} from "../ui/sidebar"
import { NavIconView } from "./nav-icon"
import { isActivePath, type NavGroup, type NavItem } from "./nav-types"

/**
 * Geometry shared by every nav row, expanded and collapsed: the icon is the first child and never moves (the row keeps
 * its `p-2` and the icon its `size-4`). The label is one line, clipped and faded when the rail is collapsed, so it
 * never wraps while the sidebar animates and never pushes the icon.
 */
const LABEL_CLASS = "min-w-0 flex-1 truncate transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0"

function NavLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const active = isActivePath(pathname, item.url, item.match)
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
  const active = isActivePath(pathname, item.url, item.match)
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

/**
 * The side navigation: a floating glass rail from 768 px (a pill of circular icon buttons when collapsed), a sheet on
 * phones (handled by `Sidebar`). The bottom of the panel is the account row (`footer`: the app's profile menu in its
 * `row` variant), separated from the navigation by a hairline.
 */
export function AppSidebar({ nav, brand, footer }: { nav: NavGroup[]; brand?: ReactNode; footer?: ReactNode }) {
  const pathname = usePathname()
  return (
    <Sidebar collapsible="icon" variant="floating">
      {brand ? <SidebarHeader>{brand}</SidebarHeader> : null}
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
      {footer ? (
        <SidebarFooter data-slot="sidebar-account" className="border-t border-hairline">
          {footer}
        </SidebarFooter>
      ) : null}
      <SidebarRail />
    </Sidebar>
  )
}
