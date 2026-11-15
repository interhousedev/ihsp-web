"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { OutlineSection } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, cn } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { LessonAccessDialog } from "../../access/components/lesson-access-dialog"
import { OutlineBadge } from "../../shared/components/outline-badge"
import { hrefs } from "../../shared/utils/hrefs"
import { stepDragId } from "../utils/outline-ops"

type OutlineStep = OutlineSection["steps"][number]

/** One step in the editor outline: drag handle, title link, badges and move / remove buttons. */
export function OutlineStepRow({
  step,
  canEdit,
  courseId,
  canManageAccess,
  restricted,
  onMove,
  onRemove,
}: {
  step: OutlineStep
  canEdit: boolean
  courseId: string
  canManageAccess: boolean
  /** The lesson has an access rule of its own. */
  restricted: boolean
  onMove: (direction: "up" | "down") => void
  onRemove: () => void
}) {
  const t = useT("outline")
  const ta = useT("access")
  const [accessOpen, setAccessOpen] = useState(false)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: stepDragId(step.step_id),
    disabled: !canEdit,
  })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "bg-card flex flex-wrap items-center gap-1 rounded-md border px-1 py-1",
        isDragging && "relative z-10 opacity-70 shadow-md",
      )}
      data-step-id={step.step_id}
    >
      {canEdit ? (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={t("dragStep", { title: step.title })}
          className="text-muted-foreground hover:bg-muted flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-md md:size-8"
        >
          <Icons.gripVertical className="size-4" aria-hidden />
        </button>
      ) : null}
      <Link
        href={hrefs.editStep(step.step_id)}
        className="min-w-[8rem] flex-1 truncate px-1 text-sm font-medium hover:underline"
      >
        {step.title}
      </Link>
      <OutlineBadge kind={step.badge} />
      {restricted ? (
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Icons.lock className="size-3.5" aria-hidden />
          {ta("restricted")}
        </span>
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setAccessOpen(true)}
        aria-label={`${ta("open")}: ${step.title}`}
        className="size-11 md:size-8"
      >
        <Icons.lock aria-hidden />
      </Button>
      {accessOpen ? (
        <LessonAccessDialog
          courseId={courseId}
          stepId={step.step_id}
          title={step.title}
          canManage={canManageAccess}
          open
          onOpenChange={setAccessOpen}
        />
      ) : null}
      {canEdit ? (
        <div className="ms-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove("up")}
            aria-label={t("moveStepUp", { title: step.title })}
            className="size-11 md:size-8"
          >
            <Icons.chevronUp aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove("down")}
            aria-label={t("moveStepDown", { title: step.title })}
            className="size-11 md:size-8"
          >
            <Icons.chevronDown aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={t("removeStep", { title: step.title })}
            className="size-11 md:size-8"
          >
            <Icons.trash aria-hidden />
          </Button>
        </div>
      ) : null}
    </li>
  )
}
