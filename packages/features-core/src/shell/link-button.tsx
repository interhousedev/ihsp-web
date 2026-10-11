"use client"

import { buttonVariants, cn } from "@ihsp/ui"
import Link from "next/link"
import type { ComponentProps } from "react"

type ButtonVariantProps = NonNullable<Parameters<typeof buttonVariants>[0]>

/** Internal paths (`/settings/`) are client-side links; anything else (another IHSP app, a file) is a normal link. */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/\\")
}

/** A link that looks like a button (same variants and sizes as `Button`, 44 px touch target on phones). */
export function LinkButton({
  href,
  variant = "outline",
  size,
  className,
  children,
  ...rest
}: Omit<ComponentProps<"a">, "href"> & { href: string } & ButtonVariantProps) {
  const classes = cn(buttonVariants({ variant, size }), className)
  if (isInternalHref(href)) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={classes} {...rest}>
      {children}
    </a>
  )
}
