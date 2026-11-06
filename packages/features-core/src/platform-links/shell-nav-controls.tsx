"use client"

import { isMiniApp, useBackButton } from "@ihsp/telegram/core"
import { normalizePath, PlatformMenu } from "@ihsp/ui"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { HistoryButtons, useHistoryStack } from "../history-nav"
import { usePlatformLinks } from "./use-platform-links"

/**
 * Inside Telegram the native back button takes the place of the history buttons: hidden on the home page, one step back
 * elsewhere, and home when the page was opened straight from a bot message.
 */
function MiniAppBack({ home }: { home: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { canBack, back } = useHistoryStack()
  const onBack = useCallback(() => (canBack ? back() : router.push(home)), [canBack, back, router, home])
  useBackButton(onBack, normalizePath(pathname) !== normalizePath(home), { fallback: true })
  return null
}

/**
 * Start of the shell's floating controls: back, forward and the menu of the other platforms.
 * `home` is the app's first page, where Telegram's back button is hidden.
 */
export function ShellNavControls({ home = "/" }: { home?: string }) {
  const platforms = usePlatformLinks()
  const [miniApp, setMiniApp] = useState(false)
  useEffect(() => setMiniApp(isMiniApp()), [])
  return (
    <>
      {miniApp ? <MiniAppBack home={home} /> : <HistoryButtons />}
      <PlatformMenu platforms={platforms} />
    </>
  )
}
