import type { IconName } from "./nav-types"
import type { PlatformLink } from "./user-menu"

/** One icon per platform, the same in the menu of every app and in the phone's "More" sheet. */
export const PLATFORM_ICONS: Record<PlatformLink["key"], IconName> = {
  sp: "grades",
  staff: "journal",
  admin: "settings",
  lms: "courses",
  library: "library",
  admission: "admission",
  id: "account",
}
