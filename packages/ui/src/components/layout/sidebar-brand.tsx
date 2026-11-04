"use client"

import { useT } from "@ihsp/i18n"
import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "../../lib/utils"
import { Icons } from "../icons"
import { useSidebar } from "../ui/sidebar"

const FADE =
  "transition-[opacity,scale] duration-(--motion-duration-base) ease-(--ease-standard) motion-reduce:transition-none"
/** Hidden at rest, shown on hover of the brand area, on keyboard focus, and always where there is no hover. */
const REVEAL =
  "opacity-0 scale-75 group-hover/brand:opacity-100 group-hover/brand:scale-100 group-has-[:focus-visible]/brand:opacity-100 group-has-[:focus-visible]/brand:scale-100 [@media(hover:none)]:opacity-100 [@media(hover:none)]:scale-100"
const CONCEAL =
  "group-hover/brand:opacity-0 group-hover/brand:scale-75 group-has-[:focus-visible]/brand:opacity-0 group-has-[:focus-visible]/brand:scale-75 [@media(hover:none)]:opacity-0"

const LOGO_BOX = "flex size-6 shrink-0 overflow-hidden rounded-lg [&>img]:size-full [&>svg]:size-full"

export type SidebarBrandProps = {
  /** The logo image or glyph (decorative); clipped to rounded corners here. */
  logo: ReactNode
  name: ReactNode
  /** The app's home. */
  href?: string
}

/**
 * The sidebar's header. From 768 px the logo is the sidebar toggle (it crossfades to the panel icon on hover or focus)
 * and the name, shown when expanded, stays the home link. In the phone sheet the logo and name are one home link.
 */
export function SidebarBrand({ logo, name, href = "/" }: SidebarBrandProps) {
  const t = useT()
  const { isMobile, open, toggleSidebar } = useSidebar()
  if (isMobile) {
    return (
      <Link href={href} className="flex min-h-11 items-center gap-2 rounded-lg px-1 font-semibold">
        <span className={LOGO_BOX}>{logo}</span>
        <span className="truncate">{name}</span>
      </Link>
    )
  }
  return (
    <div data-slot="sidebar-brand" className="group/brand flex items-center gap-2">
      <button
        type="button"
        aria-label={t("nav.toggleSidebar")}
        aria-expanded={open}
        onClick={toggleSidebar}
        className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring relative flex size-8 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-2"
      >
        <span className={cn(LOGO_BOX, FADE, CONCEAL)}>{logo}</span>
        <Icons.panelLeft aria-hidden className={cn("absolute size-5", FADE, REVEAL)} />
      </button>
      <Link
        href={href}
        className="focus-visible:ring-sidebar-ring min-w-0 flex-1 truncate rounded-md font-semibold outline-none focus-visible:ring-2 group-data-[collapsible=icon]:hidden"
      >
        {name}
      </Link>
    </div>
  )
}
