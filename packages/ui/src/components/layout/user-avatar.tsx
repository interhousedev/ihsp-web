import { cn } from "../../lib/utils"
import { Avatar, AvatarImage } from "../ui/avatar"

export type UserAvatarProps = {
  /** Full name; the initials of the first two words are shown without an image. */
  name: string
  imageUrl?: string | null
  /**
   * What shows without an image: the initials, or a gray default-person silhouette. The silhouette is for photos
   * that may be hidden from the viewer, so that "hidden" and "no photo" look the same.
   */
  placeholder?: "initials" | "person"
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

/** A gray head-and-shoulders silhouette that fills its circle. */
export function PersonSilhouette({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      data-testid="person-silhouette"
      className={cn(
        "bg-muted text-muted-foreground/60 absolute inset-0 flex items-end justify-center overflow-hidden rounded-full",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-[85%]">
        <circle cx="12" cy="8.5" r="4.5" />
        <path d="M2.5 24c0-5.2 4.3-8.5 9.5-8.5s9.5 3.3 9.5 8.5z" />
      </svg>
    </span>
  )
}

export function UserAvatar({
  name,
  imageUrl,
  placeholder = "initials",
  subtitle,
  showInfo = false,
  className,
}: UserAvatarProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className={cn("size-8 shrink-0", className)}>
        {/* Initials stay under the photo: the fallback alone is empty while the image is still loading. */}
        {placeholder === "person" ? (
          <PersonSilhouette />
        ) : (
          <span
            aria-hidden
            className="bg-primary/10 text-primary absolute inset-0 flex items-center justify-center rounded-full text-xs font-medium"
          >
            {initials(name)}
          </span>
        )}
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
