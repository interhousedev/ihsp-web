"use client"

import type { ShelfState } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from "@ihsp/ui"
import { IconBookmark, IconBookmarkFilled, IconCheck, IconChevronDown } from "@tabler/icons-react"
import { useLibraryAccess } from "../hooks/use-library-access"
import type { ShelfSubject } from "./card-utils"
import { SignInLink } from "./sign-in-link"
import { useShelf } from "./use-shelf"

const STATES: readonly ShelfState[] = ["want", "reading", "done"]

/**
 * Add to / change / remove from the shelf (Want to read, Reading, Finished). `button` shows the state with a label,
 * `icon` is the compact variant for cards and rows. A signed-out visitor gets a "Sign in" button instead.
 */
export function ShelfButton({
  item,
  variant = "button",
  className,
}: {
  item: ShelfSubject
  variant?: "button" | "icon"
  className?: string
}) {
  const t = useT("library.shelf")
  const { status, signedIn } = useLibraryAccess()
  const shelf = useShelf(item)

  if (!signedIn) {
    if (status === "loading") return null
    return variant === "icon" ? null : <SignInLink label={t("signIn")} className={className} />
  }
  const on = shelf.state !== null
  const label = on ? t("label", { state: t(shelf.state!) }) : t("add")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={variant === "icon" ? "ghost" : "outline"}
            size={variant === "icon" ? "icon" : "default"}
            disabled={shelf.pending}
            aria-label={variant === "icon" ? label : undefined}
            className={cn(variant === "icon" ? "size-11 md:size-8" : "min-h-11 md:min-h-8", className)}
          />
        }
      >
        {on ? <IconBookmarkFilled aria-hidden /> : <IconBookmark aria-hidden />}
        {variant === "icon" ? null : label}
        {variant === "icon" ? null : <IconChevronDown aria-hidden />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {STATES.map((state) => (
          <DropdownMenuItem key={state} className="min-h-11 md:min-h-8" onClick={() => shelf.set(state)}>
            {shelf.state === state ? <IconCheck aria-hidden /> : <span className="size-4" aria-hidden />}
            {t(state)}
          </DropdownMenuItem>
        ))}
        {on ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="min-h-11 md:min-h-8" onClick={() => shelf.remove()}>
              {t("remove")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
