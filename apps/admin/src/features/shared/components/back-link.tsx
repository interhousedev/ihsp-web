"use client"

import { Icons, buttonVariants } from "@ihsp/ui"
import Link from "next/link"

/** "← Students": back to the list a detail page belongs to. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={buttonVariants({ variant: "ghost", className: "-ms-2 min-h-11 w-fit md:min-h-8" })}>
      <Icons.chevronLeft aria-hidden />
      {label}
    </Link>
  )
}
