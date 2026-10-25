import { buttonVariants, cn } from "@ihsp/ui"
import Link from "next/link"
import type { ComponentProps } from "react"

type Variant = NonNullable<Parameters<typeof buttonVariants>[0]>["variant"]

/** Internal paths (`/settings/`) are client-side links; anything else (another IHSP app, a file) is a normal link. */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//")
}

/** A link that looks like a button, with the 44 px touch target on phones. */
export function LinkButton({
  href,
  variant = "outline",
  className,
  children,
  ...rest
}: Omit<ComponentProps<"a">, "href"> & { href: string; variant?: Variant }) {
  const classes = cn(buttonVariants({ variant }), "min-h-11 md:min-h-8", className)
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
