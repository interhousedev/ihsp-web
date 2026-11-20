"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "../../lib/utils"
import { Icons } from "../icons"
import { buttonVariants } from "../ui/button"

/** The same AI entry in the header of every app: a link to an assistant page (client navigation inside the app, a plain `<a>` to another host), or a button that opens its dock. */
export function AiEntryButton({ label, href, onClick }: { label: string; href?: string; onClick?: () => void }) {
  const className = cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-11 md:size-9")
  if (href?.startsWith("/")) {
    return (
      <Link href={href} aria-label={label} className={className} data-slot="ai-entry">
        <Icons.assistant aria-hidden />
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} aria-label={label} className={className} data-slot="ai-entry">
        <Icons.assistant aria-hidden />
      </a>
    )
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={className} data-slot="ai-entry">
      <Icons.assistant aria-hidden />
    </button>
  )
}

/**
 * The right cluster of every app header, in one order: the app's own tools (`children`: search, offline badge), the AI
 * entry, the notification bell where the app has one and the profile avatar, whose menu holds the app switcher.
 */
export function AppHeaderActions({
  ai,
  bell,
  profile,
  children,
}: {
  ai?: ReactNode
  bell?: ReactNode
  profile?: ReactNode
  children?: ReactNode
}) {
  return (
    <>
      {children}
      {ai}
      {bell}
      {profile}
    </>
  )
}
