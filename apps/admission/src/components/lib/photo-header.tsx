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

export type LogoFit = "circle" | "contain"

/**
 * A logo in a circle or (`contain`) a rounded square. The whole mark is always shown (object-contain with padding,
 * never cropped); `zoom` scales the image inside its frame (the catalog keeps 0.5 to 1.5, below 1 shrinks).
 */
export function LogoAvatar({
  name,
  src,
  className,
  fit = "circle",
  zoom = 1,
}: {
  name: string
  src?: string | null
  className?: string
  fit?: LogoFit
  zoom?: number
}) {
  const contain = fit === "contain"
  return (
    <Avatar
      className={cn("bg-card ring-card size-16 overflow-hidden ring-4", contain && "rounded-xl", className)}
      data-fit={fit}
    >
      {src ? (
        <AvatarImage
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className="rounded-none bg-white object-contain"
          style={{
            // Zoom above 1 trims the padding (the image still fits its frame, never cropped); below 1 it shrinks.
            padding: `${(fit === "contain" ? 6 : 4) * (1 - Math.min(Math.max(zoom - 1, 0), 2) / 2)}px`,
            ...(zoom < 1 ? { transform: `scale(${zoom})` } : {}),
          }}
        />
      ) : null}
      <AvatarFallback className={cn("bg-primary/10 text-primary text-lg font-semibold", contain && "rounded-xl")}>
        {monogram(name)}
      </AvatarFallback>
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
  logoFit,
  logoZoom,
  title,
  subtitle,
  actions,
  children,
}: {
  name: string
  coverUrl?: string | null
  logoUrl?: string | null
  logoFit?: LogoFit
  logoZoom?: number
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="bg-card border-hairline-strong rounded-card overflow-hidden border" data-testid="photo-header">
      {coverUrl ? (
        <div
          data-testid="photo-header-cover"
          className="from-primary/30 to-primary/5 h-28 bg-gradient-to-br bg-cover bg-center md:h-40"
          style={{ backgroundImage: `url(${JSON.stringify(encodeURI(coverUrl))})` }}
        />
      ) : null}
      <div className={cn("flex flex-col gap-3 px-4 pb-4 md:px-6", coverUrl ? undefined : "pt-4")}>
        <LogoAvatar
          name={name}
          src={logoUrl}
          fit={logoFit}
          zoom={logoZoom}
          className={cn("size-16 md:size-20", coverUrl ? "-mt-8 md:-mt-10" : "ring-0")}
        />
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
