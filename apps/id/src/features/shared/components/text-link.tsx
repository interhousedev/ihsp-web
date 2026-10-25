import Link from "next/link"
import type { ReactNode } from "react"

/** A small text link with a 44 px touch area. */
export function TextLink({ href, children, external }: { href: string; children: ReactNode; external?: boolean }) {
  const className =
    "text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
  if (external) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
