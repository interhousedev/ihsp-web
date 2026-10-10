"use client"

import type { ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Spinner } from "@ihsp/ui"
import { useState } from "react"
import { useArtifacts, useCreateArtifact, useNotebookUsage, notebookLimit } from "../api"
import { STUDIO_TILES, defaultCreate, isActive, quotaReached, useNotebookErrorMessage, type StudioTile } from "../lib"
import { ArtifactNotice } from "./artifact-notice"

const QUICK_TILES: readonly StudioTile["id"][] = ["conspect", "mind_map", "quiz", "flashcards"]

function tileOf(id: StudioTile["id"]): StudioTile | undefined {
  return STUDIO_TILES.find((tile) => tile.id === id)
}

/** Whether a Studio item of this tile is still being produced (the chip then shows the busy state of the tile). */
function tileIsBusy(tile: StudioTile, items: readonly ArtifactItem[] | undefined): boolean {
  return (items ?? []).some(
    (item) => isActive(item) && item.kind === tile.kind && (tile.format === undefined || item.format === tile.format),
  )
}

type QuickActionsProps = {
  notebookId: string
  /** No selected source, a running turn or an offline browser: the chips are disabled. */
  disabled?: boolean
}

/** Chips under the latest answer that start a Studio output with default options (Conspect, Mind map, Quiz, Flash cards). */
export function QuickActions({ notebookId, disabled }: QuickActionsProps) {
  const t = useT("notebooks.chat")
  const tk = useT("notebooks.kind")
  const errorMessage = useNotebookErrorMessage()
    const create = useCreateArtifact(notebookId)
  const artifacts = useArtifacts(notebookId)
  const usage = useNotebookUsage(notebookId)
  const [started, setStarted] = useState<{ tile: StudioTile; artifactId: string } | null>(null)
  const [starting, setStarting] = useState<StudioTile["id"] | null>(null)
  const limited = notebookLimit(usage.data).reached

  function start(tile: StudioTile) {
    setStarted(null)
    setStarting(tile.id)
    create.mutate(defaultCreate(tile), {
      onSuccess: (item) => setStarted({ tile, artifactId: item.id }),
      onSettled: () => setStarting(null),
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <ul aria-label={t("quick.label")} className="flex flex-wrap gap-2">
        {QUICK_TILES.map((id) => {
          const tile = tileOf(id)
          if (!tile) return null
          const Icon = tile.icon
          const busy = starting === tile.id || tileIsBusy(tile, artifacts.data)
          return (
            <li key={tile.id}>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-full px-3 md:min-h-9"
                disabled={disabled || limited || busy || quotaReached(usage.data, tile.kind)}
                aria-busy={busy || undefined}
                onClick={() => start(tile)}
              >
                {busy ? <Spinner aria-hidden /> : <Icon aria-hidden />}
                {tk(tile.labelKey)}
              </Button>
            </li>
          )
        })}
      </ul>
      {started ? (
        <ArtifactNotice
          notebookId={notebookId}
          artifactId={started.artifactId}
          kind={tk(started.tile.labelKey)}
          scope="chat.quick"
        />
      ) : null}
      {create.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(create.error)}
        </p>
      ) : null}
    </div>
  )
}
