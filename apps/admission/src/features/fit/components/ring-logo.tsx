"use client"

import { Avatar, AvatarFallback, AvatarImage, cn } from "@ihsp/ui"
import { monogram } from "../../../components/lib/photo-header"

/**
 * A university mark for the middle of a fit ring: always a circle, whatever the logo's own shape. The mark sits on a
 * white disc (logos are drawn for white), is never cropped (`object-contain`) and keeps one padding for every
 * university, so rings look alike across Today, the list, the weights preview and the catalogue.
 */
export function RingLogo({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  return (
    <Avatar
      className={cn(
        "size-full overflow-hidden rounded-full bg-white ring-1 ring-black/10 dark:ring-white/20",
        className,
      )}
    >
      {src ? <AvatarImage src={src} alt="" className="rounded-none bg-white object-contain p-[14%]" /> : null}
      <AvatarFallback className="bg-primary/10 text-primary rounded-full text-xs font-semibold">
        {monogram(name)}
      </AvatarFallback>
    </Avatar>
  )
}
