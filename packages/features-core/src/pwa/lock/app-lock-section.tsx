"use client"

import { isPwaMode } from "../utils/app-mode"
import { AppLockSectionActive } from "./app-lock-section-active"

/** "App lock" card for the Settings page. Only the installed app has one; in the portal it renders nothing. */
export function AppLockSection() {
  return isPwaMode() ? <AppLockSectionActive /> : null
}
