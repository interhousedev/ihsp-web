"use client"

import { DndContext } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { CourseDraft, OutlineOp } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, ConfirmDialog, Icons, Input } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { hrefs } from "../../shared/utils/hrefs"
import { useDraftActions } from "../hooks/use-course-draft"
import { useOutlineDnd } from "../hooks/use-outline-dnd"
import { moveSectionOps, moveStepOps, sectionDragId } from "../utils/outline-ops"
import { AddStepDialog } from "./add-step-dialog"
import { OutlineSectionCard } from "./outline-section-card"

type Removal = { kind: "step"; id: string; title: string } | { kind: "section"; id: string; title: string }

/**
 * The outline of the draft: sections and steps with badges, drag and drop (move buttons for keyboards and phones), add
 * section and add step. Every change is an outline operation sent with the draft's `lock_version`.
 */
export function OutlineEditor({ draft, canEdit }: { draft: CourseDraft; canEdit: boolean }) {
  const t = useT("outline")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const actions = useDraftActions(draft.id)
  const [newSection, setNewSection] = useState("")
  const [addStepTo, setAddStepTo] = useState<string | null>(null)
  const [removal, setRemoval] = useState<Removal | null>(null)

  const send = (ops: OutlineOp[]) => {
    if (ops.length > 0) actions.outline.mutate(ops)
  }
  const dnd = useOutlineDnd(draft.outline, send)

  function addSection(event: FormEvent) {
    event.preventDefault()
    const title = newSection.trim()
    if (!title) return
    actions.outline.mutate([{ op: "add_section", title }], { onSuccess: () => setNewSection("") })
  }

  function createStep(title: string) {
    if (!addStepTo) return
    actions.createStep.mutate(
      { section_id: addStepTo, title },
      {
        onSuccess: (step) => {
          setAddStepTo(null)
          router.push(hrefs.editStep(step.step_id))
        },
      },
    )
  }

  function confirmRemoval() {
    if (!removal) return
    const op: OutlineOp =
      removal.kind === "step"
        ? { op: "remove_step", step_id: removal.id }
        : { op: "remove_section", section_id: removal.id }
    actions.outline.mutate([op], { onSettled: () => setRemoval(null) })
  }

  return (
    <section aria-label={t("title")} className="flex flex-col gap-3">
      {actions.outline.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(actions.outline.error)}</AlertDescription>
        </Alert>
      ) : null}

      {draft.outline.length === 0 ? <p className="text-muted-foreground text-sm">{t("empty")}</p> : null}

      <DndContext sensors={dnd.sensors} collisionDetection={dnd.collisionDetection} onDragEnd={dnd.onDragEnd}>
        <SortableContext
          items={draft.outline.map((section) => sectionDragId(section.id))}
          strategy={verticalListSortingStrategy}
        >
          <ol className="flex flex-col gap-3">
            {draft.outline.map((section) => (
              <OutlineSectionCard
                key={section.id}
                section={section}
                canEdit={canEdit}
                onRename={(title) => send([{ op: "rename_section", section_id: section.id, title }])}
                onMoveSection={(direction) => send(moveSectionOps(draft.outline, section.id, direction))}
                onRemoveSection={() => setRemoval({ kind: "section", id: section.id, title: section.title })}
                onAddStep={() => setAddStepTo(section.id)}
                onMoveStep={(stepId, direction) => send(moveStepOps(draft.outline, stepId, direction))}
                onRemoveStep={(stepId) =>
                  setRemoval({
                    kind: "step",
                    id: stepId,
                    title: section.steps.find((step) => step.step_id === stepId)?.title ?? "",
                  })
                }
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      {canEdit ? (
        <form onSubmit={addSection} className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
            <label htmlFor="new-section-title" className="text-sm font-medium">
              {t("newSection")}
            </label>
            <Input
              id="new-section-title"
              value={newSection}
              onChange={(event) => setNewSection(event.target.value)}
              placeholder={t("newSectionPlaceholder")}
              className="h-11 md:h-8"
            />
          </div>
          <Button
            type="submit"
            disabled={newSection.trim() === "" || actions.outline.isPending}
            className="min-h-11 md:min-h-8"
          >
            <Icons.add aria-hidden />
            {t("addSection")}
          </Button>
        </form>
      ) : null}

      <AddStepDialog
        open={addStepTo !== null}
        onOpenChange={(open) => !open && setAddStepTo(null)}
        pending={actions.createStep.isPending}
        error={actions.createStep.error}
        onCreate={createStep}
      />
      <ConfirmDialog
        open={removal !== null}
        onOpenChange={(open) => !open && setRemoval(null)}
        title={removal?.kind === "section" ? t("removeSectionTitle") : t("removeStepTitle")}
        description={
          removal
            ? t(removal.kind === "section" ? "removeSectionDescription" : "removeStepDescription", {
                title: removal.title,
              })
            : undefined
        }
        confirmLabel={t("remove")}
        destructive
        loading={actions.outline.isPending}
        onConfirm={confirmRemoval}
      />
    </section>
  )
}
