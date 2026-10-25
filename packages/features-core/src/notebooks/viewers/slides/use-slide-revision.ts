"use client"

import type { ArtifactItem, Slide } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useState } from "react"
import { toast } from "sonner"
import { useReviseSlides } from "../../api/use-artifacts"
import { useWorkspace } from "../../workspace-context"

type Params = {
  notebookId: string
  artifactId: string
  slides: readonly Slide[]
}

/**
 * Revise mode: one instruction per slide, the list of slides that have one ("Pending changes"), and Generate, which
 * creates a NEW deck (the server keeps this one). On success the new item is announced with an "Open" action.
 */
export function useSlideRevision({ notebookId, artifactId, slides }: Params) {
  const t = useT("notebooks.slides")
  const tCommon = useT("common")
  const { openArtifact } = useWorkspace()
  const mutation = useReviseSlides(notebookId, artifactId)
  const [instructions, setInstructions] = useState<Record<string, string>>({})
  const [created, setCreated] = useState<ArtifactItem | null>(null)

  /** In deck order; slides that were deleted meanwhile are left out. */
  const pending = slides.flatMap((slide) => {
    const instruction = (instructions[slide.id] ?? "").trim()
    return instruction ? [{ slide_id: slide.id, instruction }] : []
  })

  function set(slideId: string, text: string) {
    setCreated(null)
    setInstructions((current) => ({ ...current, [slideId]: text }))
  }

  function generate() {
    if (pending.length === 0 || mutation.isPending) return
    mutation.mutate(
      { changes: pending },
      {
        onSuccess: (item) => {
          setInstructions({})
          setCreated(item)
          toast.success(t("revised"), { action: { label: tCommon("open"), onClick: () => openArtifact(item.id) } })
        },
      },
    )
  }

  return {
    instructions,
    pending,
    set,
    clear: (slideId: string) => set(slideId, ""),
    generate,
    isPending: mutation.isPending,
    error: mutation.error,
    created,
    open: (item: ArtifactItem) => openArtifact(item.id),
  }
}

export type SlideRevision = ReturnType<typeof useSlideRevision>
