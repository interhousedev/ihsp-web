import { cn } from "@ihsp/ui"

/** A hue (0-359) from the title, so the same title always gets the same colour. */
export function coverHue(title: string): number {
  let hash = 0
  for (const char of title) hash = (Math.imul(hash, 31) + (char.codePointAt(0) ?? 0)) >>> 0
  return hash % 360
}

/**
 * The cover of a book that has none: the title and author on a colour taken from the title. The text is drawn by CSS
 * from `data-title` and `data-author`, so it is not in the DOM as text: the title is already shown next to the cover,
 * and the cover is decorative (`aria-hidden`).
 */
export function GeneratedCover({
  title,
  author,
  className,
}: {
  title: string
  author?: string | null
  className?: string
}) {
  const hue = coverHue(title)
  return (
    <div
      aria-hidden
      data-title={title}
      data-author={author ?? ""}
      className={cn(
        "flex flex-col justify-between overflow-hidden p-2 font-serif font-semibold text-white",
        "before:block before:text-sm before:leading-tight before:line-clamp-5 before:break-words before:content-[attr(data-title)] sm:before:text-base",
        "after:block after:truncate after:text-xs after:font-normal after:opacity-80 after:content-[attr(data-author)]",
        className,
      )}
      style={{ backgroundImage: `linear-gradient(160deg, hsl(${hue} 55% 36%), hsl(${hue} 60% 28%))` }}
    />
  )
}
