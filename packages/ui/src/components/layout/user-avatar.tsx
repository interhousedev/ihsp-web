import { cn } from "../../lib/utils"
import { Avatar, AvatarImage } from "../ui/avatar"

export type UserAvatarProps = {
  /** Full name; the initials of the first two words are shown without an image. */
  name: string
  imageUrl?: string | null
  /** Second line (login or role); with `showInfo` the name block is rendered next to the avatar. */
  subtitle?: string | null
  showInfo?: boolean
  className?: string
}

export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
  return letters.join("") || "?"
}

export function UserAvatar({ name, imageUrl, subtitle, showInfo = false, className }: UserAvatarProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className={cn("size-8 shrink-0", className)}>
        {/* Initials stay under the photo: the fallback alone is empty while the image is still loading. */}
        <span
          aria-hidden
          className="bg-primary/10 text-primary absolute inset-0 flex items-center justify-center rounded-full text-xs font-medium"
        >
          {initials(name)}
        </span>
        {imageUrl ? <AvatarImage src={imageUrl} alt="" className="absolute inset-0" /> : null}
      </Avatar>
      {showInfo ? (
        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{name}</span>
          {subtitle ? <span className="text-muted-foreground truncate text-xs">{subtitle}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
