"use client"

import { useT } from "@ihsp/i18n"
import { Icons } from "../icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { IconButton } from "../ui/icon-button"
import { PlatformIcon } from "./platform-icon"
import type { PlatformLink } from "./user-menu"

/**
 * The app chooser: every platform of this user as one tile (icon, name, what it is for), the current one marked.
 * Links open in the same tab. Used inside a dropdown by `PlatformMenu` and by the phone account menu.
 */
export function PlatformMenuGrid({ platforms, label = false }: { platforms: PlatformLink[]; label?: boolean }) {
  const t = useT()
  return (
    <DropdownMenuGroup>
      {label ? <DropdownMenuLabel>{t("platforms.title")}</DropdownMenuLabel> : null}
      <div className="grid grid-cols-2 gap-1" data-testid="app-switcher">
        {platforms.map((platform) => (
          <DropdownMenuItem
            key={platform.key}
            className="min-h-11 min-w-0 flex-col items-start gap-2 px-2 py-2 md:min-h-9"
            render={
              <a
                href={platform.href}
                aria-current={platform.current ? "page" : undefined}
                data-platform={platform.key}
                onClick={platform.onClick}
              />
            }
          >
            <span className="relative">
              <PlatformIcon platform={platform} size="md" />
              {platform.current ? (
                <>
                  <span
                    aria-hidden
                    className="bg-primary text-primary-foreground ring-popover absolute -end-1 -top-1 flex size-4 items-center justify-center rounded-full ring-2"
                  >
                    <Icons.check className="size-3" />
                  </span>
                  <span className="sr-only">{t("platforms.current")}</span>
                </>
              ) : null}
            </span>
            <span className="flex w-full min-w-0 flex-col">
              <span className="truncate font-medium">{platform.name}</span>
              <span className="text-muted-foreground truncate text-xs">{platform.description}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </div>
    </DropdownMenuGroup>
  )
}

/**
 * The app switcher button of the sidebar header: opens the chooser with every platform of this user. Nothing when
 * there is nowhere else to go.
 */
export function PlatformMenu({ platforms }: { platforms: PlatformLink[] }) {
  const t = useT()
  if (platforms.filter((platform) => !platform.current).length === 0) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<IconButton data-slot="platform-switcher" icon={Icons.platforms} aria-label={t("platforms.title")} />}
      />
      <DropdownMenuContent align="start" className="w-72" sideOffset={10}>
        <PlatformMenuGrid platforms={platforms} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
