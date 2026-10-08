import { cn } from "../../lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

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
      <Avatar className={cn("size-8", className)}>
        {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
        <AvatarFallback className="rounded-lg text-xs">{initials(name)}</AvatarFallback>
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
