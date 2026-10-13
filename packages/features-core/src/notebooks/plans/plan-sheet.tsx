"use client"

import type { PlanSlide, PresentationPlan } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Input,
  Label,
  LoadingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Spinner,
} from "@ihsp/ui"
import { useId, useState } from "react"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { applyChange } from "./apply-change"
import { trimTo } from "./plan-edit"
import { PlanSlideEditor } from "./plan-slide-editor"
import { useConfirmPresentationPlan, usePresentationPlan, useSavePresentationPlan } from "./use-presentation-plan"

const MIN_SLIDES = 3

export type PlanSheetProps = {
  notebookId: string
  planId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The side panel of a presentation plan (PLAN): edit the outline, then Generate the deck from it. */
export function PlanSheet({ notebookId, planId, open, onOpenChange }: PlanSheetProps) {
  const t = useT("notebooks.plan")
  const plan = usePresentationPlan(notebookId, open ? planId : null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        {plan.data ? (
          // Keyed by `updated_at`: a saved or confirmed plan restarts the draft from the server's copy.
          <PlanEditor key={plan.data.updated_at} notebookId={notebookId} plan={plan.data} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <Spinner aria-label={t("making")} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function PlanEditor({ notebookId, plan }: { notebookId: string; plan: PresentationPlan }) {
  const t = useT("notebooks.plan")
  const root = useT()
  const errorMessage = useNotebookErrorMessage()
  const titleId = useId()
  const save = useSavePresentationPlan(notebookId, plan.id)
  const confirm = useConfirmPresentationPlan(notebookId, plan.id)
  const [title, setTitle] = useState(plan.title)
  const [slides, setSlides] = useState<readonly PlanSlide[]>(plan.slides)
  const readOnly = plan.status === "confirmed"
  const dirty = title !== plan.title || slides !== plan.slides
  const over = slides.length > plan.max_slides
  const tooFew = slides.length < MIN_SLIDES
  const busy = save.isPending || confirm.isPending
  const failure = save.error ?? confirm.error

  const body = () => ({ title: title.trim() || plan.title, slides: [...slides] })
  const generate = async () => {
    try {
      if (dirty) await save.mutateAsync(body())
      await confirm.mutateAsync()
    } catch {
      // the error shows under the outline; the edits stay
    }
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={titleId}>{t("deckTitle")}</Label>
          <Input
            id={titleId}
            value={title}
            readOnly={readOnly}
            maxLength={255}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <ol className="flex flex-col gap-2" aria-label={t("card", { title, count: slides.length })}>
          {slides.map((slide, index) => (
            <PlanSlideEditor
              // Slides have no ids; a slide's position is its identity in the outline being edited.
              key={`${index}:${slides.length}`}
              slide={slide}
              number={index + 1}
              count={slides.length}
              readOnly={readOnly}
              onChange={(change) => setSlides((current) => applyChange(current, index, change))}
            />
          ))}
        </ol>
        {over && !readOnly ? (
          <div role="alert" className="flex flex-col gap-2 rounded-lg border border-amber-500/40 p-3 text-sm">
            <p>{t("overLimit", { count: slides.length, max: plan.max_slides })}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setSlides((current) => trimTo(current, plan.max_slides))}
            >
              {t("trim", { max: plan.max_slides })}
            </Button>
          </div>
        ) : null}
        {tooFew && !readOnly ? <p className="text-muted-foreground text-sm">{t("tooFew")}</p> : null}
        {readOnly ? (
          <p role="status" className="text-muted-foreground text-sm">
            {t("generating")}
          </p>
        ) : null}
        {failure ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(failure)}
          </p>
        ) : null}
      </div>
      {readOnly ? null : (
        <SheetFooter className="flex-row justify-end border-t">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={!dirty || busy}
            onClick={() => save.mutate(body())}
          >
            {t("save")}
          </Button>
          <LoadingButton
            type="button"
            className="min-h-11 md:min-h-8"
            loading={confirm.isPending}
            loadingLabel={root("common.loading")}
            disabled={over || tooFew || busy}
            onClick={() => void generate()}
          >
            {t("generate")}
          </LoadingButton>
        </SheetFooter>
      )}
    </>
  )
}
