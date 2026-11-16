"use client"

import { Avatar, AvatarFallback, AvatarImage, cn } from "@ihsp/ui"
import type { ReactNode } from "react"

/** Up to two capital letters of a name, for a logo that is missing. */
export function monogram(name: string): string {
  const words = name.split(/\s+/).filter((word) => /^\p{L}/u.test(word))
  return (words.length > 1 ? words.slice(0, 2).map((word) => word[0]) : Array.from((words[0] ?? "?").slice(0, 2)))
    .join("")
    .toUpperCase()
}

export function LogoAvatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  return (
    <Avatar className={cn("bg-card ring-card size-16 ring-4", className)}>
      {src ? <AvatarImage src={src} alt="" referrerPolicy="no-referrer" /> : null}
      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">{monogram(name)}</AvatarFallback>
    </Avatar>
  )
}

/**
 * A LinkedIn-style header: a cover photo (a brand gradient when there is none), the logo overlapping its bottom edge,
 * then the title block and the actions. Adapted from dashboard/page-header-03 of the library.
 */
export function PhotoHeader({
  name,
  coverUrl,
  logoUrl,
  title,
  subtitle,
  actions,
  children,
}: {
  name: string
  coverUrl?: string | null
  logoUrl?: string | null
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="bg-card border-hairline-strong rounded-card overflow-hidden border" data-testid="photo-header">
      <div
        data-testid="photo-header-cover"
        className="from-primary/30 to-primary/5 h-28 bg-gradient-to-br bg-cover bg-center md:h-40"
        style={coverUrl ? { backgroundImage: `url(${JSON.stringify(encodeURI(coverUrl))})` } : undefined}
      />
      <div className="flex flex-col gap-3 px-4 pb-4 md:px-6">
        <LogoAvatar name={name} src={logoUrl} className="-mt-8 size-16 md:-mt-10 md:size-20" />
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
            {subtitle ? <p className="text-muted-foreground text-sm">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {children}
      </div>
    </header>
  )
}
