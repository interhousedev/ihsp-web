"use client"

import { useState } from "react"
import { NavIconView } from "./nav-icon"
import { PLATFORM_ICONS } from "./platform-icons"
import type { PlatformLink } from "./user-menu"

/** The app's own icon file, or the registry icon of the platform in a tile when the file is missing or fails to load. */
export function PlatformIcon({ platform }: { platform: Pick<PlatformLink, "key" | "iconSrc"> }) {
  const [failed, setFailed] = useState(false)
  if (platform.iconSrc && !failed) {
    return (
      // oxlint-disable-next-line nextjs/no-img-element -- static export, the icon is a plain file of that app
      <img
        src={platform.iconSrc}
        alt=""
        width={28}
        height={28}
        className="size-7 shrink-0 rounded-md"
        data-testid={`platform-icon-${platform.key}`}
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span
      className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md"
      data-testid={`platform-icon-${platform.key}`}
    >
      <NavIconView icon={PLATFORM_ICONS[platform.key]} className="size-4" />
    </span>
  )
}
