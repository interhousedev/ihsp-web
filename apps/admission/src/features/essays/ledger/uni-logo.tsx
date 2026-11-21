"use client"

import { Avatar, AvatarFallback, AvatarImage, cn } from "@ihsp/ui"
import { monogram } from "../../../components/lib/photo-header"
import { useInstitution } from "../../chooser/hooks"

const SIZES = { sm: "size-5 text-[8px]", md: "size-8 text-[10px]", lg: "size-11 text-xs" } as const

/** The round logo of a university from the catalog; a monogram while it loads or when it has none. */
export function UniLogo({ id, name, size = "sm", className }: { id: string; name: string; size?: keyof typeof SIZES; className?: string }) {
  const query = useInstitution(id)
  const src = query.data?.logo_url
  return (
    <Avatar className={cn("bg-card ring-card shrink-0 overflow-hidden ring-1 ring-offset-0", SIZES[size], className)} title={name}>
      {src ? <AvatarImage src={src} alt="" className="rounded-none bg-white object-contain p-0.5" /> : null}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{monogram(name)}</AvatarFallback>
    </Avatar>
  )
}

/** Up to `max` overlapping logos, then "+N". */
export function UniLogoStack({ unis, max = 4 }: { unis: { id: string; name: string }[]; max?: number }) {
  const shown = unis.slice(0, max)
  return (
    <span className="flex shrink-0 items-center" aria-label={unis.map((u) => u.name).join(", ")}>
      {shown.map((u, i) => (
        <UniLogo key={u.id} id={u.id} name={u.name} className={i > 0 ? "-ml-1.5" : undefined} />
      ))}
      {unis.length > max ? <span className="text-muted-foreground ml-1 text-xs">+{unis.length - max}</span> : null}
    </span>
  )
}
