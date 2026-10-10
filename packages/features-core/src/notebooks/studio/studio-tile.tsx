"use client"

import { useT } from "@ihsp/i18n"
import { Spinner, cn } from "@ihsp/ui"
import { IconPencil } from "@ihsp/ui"
import type { StudioTile as StudioTileDef } from "../lib/artifact-kinds"

export type StudioTileProps = {
  tile: StudioTileDef
  /** Name of the tile ("Quiz"). */
  label: string
  /** An item of this kind is being created right now (the tile still starts another). */
  busy: boolean
  /** Why the tile cannot start anything now (shown as a tooltip and read as its description). */
  disabledReason: string | null
  /** A start request is in flight. */
  pending: boolean
  onStart: () => void
  onCustomize: () => void
}

/** One Studio button: icon and label start a generation with the default options, the pencil opens the form. */
export function StudioTile({ tile, label, busy, disabledReason, pending, onStart, onCustomize }: StudioTileProps) {
  const t = useT("notebooks")
  const Icon = tile.icon
  const disabled = disabledReason !== null || pending

  return (
    <li className="group/tile relative">
      <button
        type="button"
        disabled={disabled}
        title={disabledReason ?? undefined}
        className={cn(
          "bg-muted/50 hover:bg-muted focus-visible:ring-ring/50 flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center text-sm font-medium outline-none focus-visible:ring-3",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        onClick={onStart}
      >
        <Icon className="size-6" aria-hidden />
        <span className="leading-tight text-balance">{label}</span>
      </button>
      {busy ? (
        <Spinner
          aria-label={t("studio.tileBusy")}
          className="text-muted-foreground absolute start-2 top-2 size-3.5 motion-reduce:animate-none"
        />
      ) : null}
      <button
        type="button"
        aria-label={t("studio.customize", { kind: label })}
        className={cn(
          "text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-ring/50 absolute end-0 top-0 flex size-11 items-center justify-center rounded-xl outline-none focus-visible:ring-3 md:size-8",
          // Always visible on touch screens; on a desktop it appears on hover and focus.
          "md:opacity-0 md:group-focus-within/tile:opacity-100 md:group-hover/tile:opacity-100 md:focus-visible:opacity-100",
        )}
        onClick={onCustomize}
      >
        <IconPencil className="size-4" aria-hidden />
      </button>
    </li>
  )
}
