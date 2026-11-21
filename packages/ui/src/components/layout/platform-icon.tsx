import { cn } from "../../lib/utils"
import { PLATFORM_MARKS } from "./platform-marks"
import type { PlatformLink } from "./user-menu"

/**
 * The app's mark: exactly the glyph of its favicon and PWA icon (`apps/<app>/public/icons/logo.svg`, generated into
 * `platform-marks.ts`) on the brand tile, the same in the sidebar, the app switcher and the phone "More" sheet.
 * `sm` is the 28 px tile of lists, `md` the 36 px tile of the app switcher.
 */
export function PlatformIcon({
  platform,
  size = "sm",
  className,
}: {
  platform: Pick<PlatformLink, "key">
  size?: "sm" | "md"
  className?: string
}) {
  const mark = PLATFORM_MARKS[platform.key]
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 overflow-hidden rounded-lg", size === "md" ? "size-9" : "size-7", className)}
      data-testid={`platform-icon-${platform.key}`}
    >
      <svg viewBox="0 0 500 500" className="size-full" fill="none">
        <rect width="500" height="500" fill="var(--brand)" />
        {mark.paths.map((d) => (
          <path key={d} d={d} fill="white" fillRule={mark.evenodd ? "evenodd" : undefined} />
        ))}
      </svg>
    </span>
  )
}
