"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "../icons"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { IconButton } from "../ui/icon-button"
import type { PlatformLink } from "./user-menu"

/** The other IHSP platforms of this user behind one icon; nothing when there are none. Links open in the same tab. */
export function PlatformMenu({ platforms }: { platforms: PlatformLink[] }) {
  const t = useT()
  const others = platforms.filter((platform) => !platform.current)
  if (others.length === 0) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<IconButton icon={Icons.platforms} aria-label={t("platforms.title")} />} />
      <DropdownMenuContent align="end" className="w-64" sideOffset={10}>
        {others.map((platform) => (
          <DropdownMenuItem
            key={platform.key}
            className="min-h-11 md:min-h-9"
            render={<a href={platform.href} data-platform={platform.key} />}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium">{platform.name}</span>
              <span className="text-muted-foreground truncate text-xs">{platform.description}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
