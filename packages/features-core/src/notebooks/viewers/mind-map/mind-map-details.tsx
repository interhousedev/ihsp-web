"use client"

import type { RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  useIsMobile,
} from "@ihsp/ui"
import { IconX } from "@tabler/icons-react"
import { useEffect, useRef } from "react"
import { RefChips } from "../../chat/ref-chips"
import { cardPlacement } from "./card-placement"
import type { Bounds, PositionedNode } from "./layout"
import { MindMapDetailsBody } from "./mind-map-details-body"
import { MindMapNodeActions } from "./mind-map-node-actions"
import type { Size } from "./transform"

type MindMapDetailsProps = {
  item: PositionedNode
  refsIndex: RefsIndex
  /** The node's box in canvas pixels, to anchor the card. */
  anchor: Bounds
  size: Size
  onToggle: () => void
  onClose: () => void
}

/**
 * The details of a clicked node: its note, source chips, **Ask in chat** and **Show sources**. A small card next to
 * the node on a desktop, a bottom sheet on a phone. Esc closes it and the focus returns to the node.
 */
export function MindMapDetails({ item, refsIndex, anchor, size, onToggle, onClose }: MindMapDetailsProps) {
  const t = useT("notebooks")
  const isMobile = useIsMobile()
  const cardRef = useRef<HTMLDivElement | null>(null)
  const { node } = item
  const expanded = item.hasChildren ? !item.collapsed : null

  // The card is keyed by node, so it takes focus once per node.
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true })
  }, [])

  // Esc closes the card from anywhere inside it.
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return
      event.stopPropagation()
      onClose()
    }
    card.addEventListener("keydown", onKeyDown)
    return () => card.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader className="text-start">
            <DrawerTitle>{node.label}</DrawerTitle>
            {node.note ? <DrawerDescription>{node.note}</DrawerDescription> : null}
          </DrawerHeader>
          <div className="flex flex-col gap-3 px-4">
            <RefChips refs={node.refs} refsIndex={refsIndex} />
          </div>
          <DrawerFooter>
            <MindMapNodeActions node={node} refsIndex={refsIndex} onAsked={onClose}>
              {expanded !== null ? (
                <Button type="button" variant="ghost" className="min-h-11" onClick={onToggle}>
                  {expanded ? t("mindmap.collapse") : t("mindmap.expand")}
                </Button>
              ) : null}
            </MindMapNodeActions>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label={t("mindmap.details", { label: node.label })}
      tabIndex={-1}
      data-slot="mind-map-details"
      style={cardPlacement(anchor, size)}
      className="bg-popover text-popover-foreground ring-foreground/10 absolute z-20 flex flex-col gap-2.5 rounded-lg p-3 text-sm shadow-md ring-1 outline-hidden"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium break-words">{node.label}</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="-me-1 -mt-1 size-11 shrink-0 md:size-7"
          aria-label={t("viewer.close")}
          onClick={onClose}
        >
          <IconX aria-hidden />
        </Button>
      </div>
      <MindMapDetailsBody node={node} refsIndex={refsIndex} expanded={expanded} onToggle={onToggle} onAsked={onClose} />
    </div>
  )
}
