import { cn } from "@ihsp/ui"

/** The cover of a course: its picture, or a green tile with the first letter of the title, 16:9 like Stepik's. */
export function CourseCover({
  title,
  url,
  className,
  eager,
}: {
  title: string
  url: string | null
  className?: string
  /** Load the picture right away (the course page); cards in lists load it lazily. */
  eager?: boolean
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
  return (
    <div
      aria-hidden
      className={cn(
        "flex aspect-video w-full items-center justify-center bg-gradient-to-br from-(--stepik-green)/45 to-(--stepik-green-strong)/35 text-5xl font-bold text-(--stepik-green-strong) dark:text-(--stepik-green)",
        className,
      )}
    >
      {title.slice(0, 1).toUpperCase()}
    </div>
  )
}
