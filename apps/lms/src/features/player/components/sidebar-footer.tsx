"use client"

import { useT } from "@ihsp/i18n"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ExitFullscreenIcon, FullscreenIcon } from "../../shared/components/learner-icons"

export type SidebarLink = { key: string; label: string; href: string }

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen()
  else void document.documentElement.requestFullscreen()
}

const ICON_BUTTON = "size-11 text-(--stepik-chrome-muted) hover:text-white lg:size-9"

/**
 * The bottom of the course sidebar, like Stepik's: a full screen toggle (only where the browser can do it) and a
 * settings menu with the links back to the course.
 */
export function SidebarFooter({ links }: { links: readonly SidebarLink[] }) {
  const t = useT("player")
  const [supported, setSupported] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    setSupported(typeof document.documentElement.requestFullscreen === "function")
    const sync = () => setFullscreen(document.fullscreenElement !== null)
    document.addEventListener("fullscreenchange", sync)
    return () => document.removeEventListener("fullscreenchange", sync)
  }, [])

  const FullscreenToggle = fullscreen ? ExitFullscreenIcon : FullscreenIcon
  return (
    <div className="flex items-center justify-between border-t border-white/10 px-2 py-1">
      {supported ? (
        <Button
          variant="ghost"
          className={ICON_BUTTON}
          aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
          aria-pressed={fullscreen}
          onClick={toggleFullscreen}
        >
          <FullscreenToggle aria-hidden className="size-5" />
        </Button>
      ) : (
        <span />
      )}
      {links.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className={ICON_BUTTON} aria-label={t("settings")} />}>
            <Icons.settings aria-hidden className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            {links.map((link) => (
              <DropdownMenuItem
                key={link.key}
                className="min-h-11 md:min-h-8"
                render={<Link href={link.href} aria-label={link.label} />}
              >
                {link.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
