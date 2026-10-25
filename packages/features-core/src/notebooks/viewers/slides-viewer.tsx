"use client"

import { SlidesDeck } from "./slides/slides-deck"
import type { ViewerProps } from "./viewer-props"

/**
 * The slide deck: thumbnails, a 16:9 stage, a slideshow, an Edit mode (inline
 * fields, reorder, delete, saved with `PUT …/slides`), a Revise mode (instructions per slide, a new deck) and Print / PDF.
 * `ArtifactViewer` renders the header and the loading, failed and generating states around it.
 */
export function SlidesViewer({ notebookId, artifact }: ViewerProps<"slides">) {
  if (!artifact.content) return null
  return <SlidesDeck notebookId={notebookId} artifact={artifact} content={artifact.content} />
}
