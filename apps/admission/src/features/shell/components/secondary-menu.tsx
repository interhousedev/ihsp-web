"use client"

import { useT } from "@ihsp/i18n"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Icons,
  NavIconView,
  type NavItem,
} from "@ihsp/ui"
import Link from "next/link"

/**
 * Phone header: the secondary links (knowledge base, consultations, settings), the staff entries of a user who is also
 * staff, and the account menu. The bottom bar holds the sections, so these have no other place on a phone.
 */
export function SecondaryMenu({ links, staff = [] }: { links: NavItem[]; staff?: NavItem[] }) {
  const t = useT("nav")
  const row = (item: NavItem) => (
    <DropdownMenuItem key={item.url} className="min-h-11" render={<Link href={item.url} />}>
      <NavIconView icon={item.icon} className="size-5 shrink-0" />
      {item.title}
    </DropdownMenuItem>
  )
  return (
    <div className="flex items-center gap-1 md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger render={<IconButton icon={Icons.dots} aria-label={t("menu")} />} />
        <DropdownMenuContent align="end" className="max-h-[70dvh] w-56 overflow-y-auto" sideOffset={10}>
          {links.map(row)}
          {staff.length > 0 ? <DropdownMenuSeparator /> : null}
          {staff.map(row)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
