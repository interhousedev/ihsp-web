"use client"

import Link from "next/link"
import { cn } from "../../lib/utils"
import { Icons } from "../icons"
import { buttonVariants } from "../ui/button"

/** The same AI entry in the shell of every app (the sidebar bottom menu, the phone top bar): a link to an assistant page (client navigation inside the app, a plain `<a>` to another host), or a button that opens its dock. */
export function AiEntryButton({ label, href, onClick }: { label: string; href?: string; onClick?: () => void }) {
  const className = cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-11 md:size-8")
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
