"use client"

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { OutlineSection } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, cn } from "@ihsp/ui"
import { useState } from "react"
import { sectionDragId, stepDragId } from "../utils/outline-ops"
import { OutlineStepRow } from "./outline-step-row"
import { SectionDropZone } from "./section-drop-zone"

/** A section of the editor outline: rename in place, move, remove (when empty), add a step, and its steps. */
export function OutlineSectionCard({
  section,
  canEdit,
  onRename,
  onMoveSection,
  onRemoveSection,
  onAddStep,
  onMoveStep,
  onRemoveStep,
}: {
  section: OutlineSection
  canEdit: boolean
  onRename: (title: string) => void
  onMoveSection: (direction: "up" | "down") => void
  onRemoveSection: () => void
  onAddStep: () => void
  onMoveStep: (stepId: string, direction: "up" | "down") => void
  onRemoveStep: (stepId: string) => void
}) {
  const t = useT("outline")
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(section.title)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionDragId(section.id),
    disabled: !canEdit,
  })

  function commit() {
    const next = title.trim()
    setEditing(false)
    if (next && next !== section.title) onRename(next)
    else setTitle(section.title)
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "bg-muted/30 flex flex-col gap-2 rounded-lg border p-2",
        isDragging && "relative z-10 opacity-70 shadow-md",
      )}
      data-section-id={section.id}
    >
      <div className="flex flex-wrap items-center gap-1">
        {canEdit ? (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={t("dragSection", { title: section.title })}
            className="text-muted-foreground hover:bg-muted flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-md md:size-8"
          >
            <Icons.gripVertical className="size-4" aria-hidden />
          </button>
        ) : null}
        {editing ? (
          <Input
            value={title}
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit()
              if (event.key === "Escape") {
                setTitle(section.title)
                setEditing(false)
              }
            }}
            aria-label={t("sectionTitle")}
            className="h-11 min-w-[8rem] flex-1 md:h-8"
          />
        ) : (
          <h3 className="min-w-[8rem] flex-1 truncate px-1 text-sm font-semibold">{section.title}</h3>
        )}
        {canEdit && !editing ? (
          <div className="ms-auto flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditing(true)}
              aria-label={t("renameSection", { title: section.title })}
              className="size-11 md:size-8"
            >
              <Icons.edit aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveSection("up")}
              aria-label={t("moveSectionUp", { title: section.title })}
              className="size-11 md:size-8"
            >
              <Icons.chevronUp aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMoveSection("down")}
              aria-label={t("moveSectionDown", { title: section.title })}
              className="size-11 md:size-8"
            >
              <Icons.chevronDown aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemoveSection}
              disabled={section.steps.length > 0}
              aria-label={t("removeSection", { title: section.title })}
              className="size-11 md:size-8"
            >
              <Icons.trash aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>

      <SortableContext
        items={section.steps.map((step) => stepDragId(step.step_id))}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-1">
          {section.steps.map((step) => (
            <OutlineStepRow
              key={step.step_id}
              step={step}
              canEdit={canEdit}
              onMove={(direction) => onMoveStep(step.step_id, direction)}
              onRemove={() => onRemoveStep(step.step_id)}
            />
          ))}
          {canEdit ? <SectionDropZone sectionId={section.id} empty={section.steps.length === 0} /> : null}
        </ul>
      </SortableContext>

      {canEdit ? (
        <Button variant="outline" size="sm" onClick={onAddStep} className="w-fit min-h-11 md:min-h-7">
          <Icons.add aria-hidden />
          {t("addStep")}
        </Button>
      ) : null}
    </li>
  )
}
