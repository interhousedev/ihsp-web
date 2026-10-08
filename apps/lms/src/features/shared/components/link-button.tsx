"use client"

import { buttonVariants, cn } from "@ihsp/ui"
import type { VariantProps } from "class-variance-authority"
import Link from "next/link"
import type { ComponentProps } from "react"

/** A link that looks like a button (same variants as `Button`), for navigation that must stay a real `<a>`. */
export function LinkButton({
  variant,
  size,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  )
}
