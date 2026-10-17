import { cn } from "@ihsp/ui"
import { isHexColor, readableOn } from "../../settings/utils/color"

/** The cover of a course: its picture, or a green tile with the first letter of the title, 16:9 like Stepik's. */
export function CourseCover({
  title,
  url,
  className,
  eager,
  accent,
}: {
  title: string
  url: string | null
  className?: string
  /** Load the picture right away (the course page); cards in lists load it lazily. */
  eager?: boolean
  /** The accent colour of the course; the letter tile uses it when there is no picture. */
  accent?: string | null
}) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        loading={eager ? "eager" : "lazy"}
        className={cn("aspect-video w-full object-cover", className)}
      />
    )
  }
  const tint = accent && isHexColor(accent) ? { backgroundColor: accent, color: readableOn(accent) } : undefined
  return (
    <div
      aria-hidden
      style={tint}
      className={cn(
        "flex aspect-video w-full items-center justify-center bg-gradient-to-br from-(--stepik-green)/45 to-(--stepik-green-strong)/35 text-5xl font-bold text-(--stepik-green-strong) dark:text-(--stepik-green)",
        className,
      )}
    >
      {title.slice(0, 1).toUpperCase()}
    </div>
  )
}
