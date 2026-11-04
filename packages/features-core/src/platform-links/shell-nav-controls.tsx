"use client"

import { PlatformMenu } from "@ihsp/ui"
import { HistoryButtons } from "../history-nav"
import { usePlatformLinks } from "./use-platform-links"

/** Start of the shell's floating controls: back, forward and the menu of the other platforms. */
export function ShellNavControls() {
  const platforms = usePlatformLinks()
  return (
    <>
      <HistoryButtons />
      <PlatformMenu platforms={platforms} />
    </>
  )
}
