import type { IconName } from "./nav-types"
import type { PlatformLink } from "./user-menu"

/** One nav-icon name per platform (for places that need a plain icon; the app mark is `PlatformIcon`). */
export const PLATFORM_ICONS: Record<PlatformLink["key"], IconName> = {
  sp: "grades",
  staff: "journal",
  admin: "settings",
  lms: "courses",
  library: "library",
  admission: "admission",
  id: "account",
}
