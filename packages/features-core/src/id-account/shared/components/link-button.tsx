import { buttonVariants } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { useIdHref } from "../hooks/use-id-href"

type LinkButtonProps = {
  href: string
  children: ReactNode
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  /** A plain anchor for another origin (other platforms, `t.me`). */
  external?: boolean
  /** Opens in a new tab (implies a plain anchor). */
  newTab?: boolean
  className?: string
}

/** A link that looks like a button, at least 44 px tall. Internal links use `next/link`. */
export function LinkButton({
  href: path,
  children,
  variant = "default",
  external,
  newTab,
  className,
}: LinkButtonProps) {
  const resolved = useIdHref()(path)
  const href = resolved.href
  const classes = buttonVariants({ variant, className: `h-11 px-4 text-base ${className ?? ""}` })
  if (external || newTab || resolved.external) {
    return (
      <a href={href} {...(newTab ? { target: "_blank", rel: "noreferrer" } : {})} className={classes}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  )
}
