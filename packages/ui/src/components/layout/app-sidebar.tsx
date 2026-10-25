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

function NavLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const active = isActivePath(pathname, item.url, item.match)
  const link = item.external ? (
    <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={item.title} />
  ) : (
    <Link href={item.url} aria-label={item.title} aria-current={active ? "page" : undefined} />
  )
  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={link} tooltip={item.title} isActive={active} aria-disabled={item.disabled}>
        <NavIconView icon={item.icon} />
        <span>{item.title}</span>
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
        <span>{item.title}</span>
        <Icons.chevronRight className="ml-auto transition-transform duration-200 group-data-panel-open/collapsible:rotate-90" />
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

/** The side navigation: a fixed sidebar from 768 px, a sheet on phones (handled by `Sidebar`). */
export function AppSidebar({ nav, brand, footer }: { nav: NavGroup[]; brand?: ReactNode; footer?: ReactNode }) {
  const pathname = usePathname()
  return (
    <Sidebar collapsible="icon">
      {brand ? <SidebarHeader className="group-data-[collapsible=icon]:pt-4">{brand}</SidebarHeader> : null}
      <SidebarContent className="overflow-x-hidden">
        {nav.map((group, index) => (
          <SidebarGroup key={group.label ?? `group-${index}`} className="py-0">
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
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
      {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
      <SidebarRail />
    </Sidebar>
  )
}
