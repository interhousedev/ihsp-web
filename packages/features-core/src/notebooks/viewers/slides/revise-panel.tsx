"use client"

import type { Slide } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Textarea } from "@ihsp/ui"
import { useNotebookErrorMessage } from "../../lib/use-notebook-error"
import { slideName } from "./slide-deck-state"
import type { SlideRevision } from "./use-slide-revision"

type RevisePanelProps = {
  slides: readonly Slide[]
  slide: Slide
  /** 1-based position of `slide`. */
  number: number
  revision: SlideRevision
  /** There are unsaved edits: the server would revise the old deck, so Generate waits. */
  blocked: boolean
  onSelect: (slideId: string) => void
}

/** Revise mode: the instruction for the selected slide, the "Pending changes" list and Generate revised deck. */
export function RevisePanel({ slides, slide, number, revision, blocked, onSelect }: RevisePanelProps) {
  const t = useT("notebooks.slides")
  const tCommon = useT("common")
  const errorMessage = useNotebookErrorMessage()
  const { pending, isPending, created } = revision

  return (
    <section
      aria-label={t("reviseTitle", { n: number })}
      className="bg-card flex flex-col gap-4 rounded-xl border p-3 md:p-4"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{t("reviseTitle", { n: number })}</h3>
        <p className="text-muted-foreground text-xs">{t("reviseHelp")}</p>
      </div>
      <Textarea
        aria-label={t("instruction", { n: number })}
        placeholder={t("instructionPlaceholder")}
        value={revision.instructions[slide.id] ?? ""}
        rows={3}
        onChange={(event) => revision.set(slide.id, event.target.value)}
      />

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{t("pending")}</h3>
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("pendingEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5" aria-label={t("pending")}>
            {pending.map((change) => {
              const position = slides.findIndex((item) => item.id === change.slide_id)
              const target = slides[position]
              return (
                <li key={change.slide_id} className="bg-muted/50 flex items-start gap-1 rounded-lg border p-1.5">
                  <button
                    type="button"
                    className="focus-visible:ring-ring flex min-h-11 min-w-0 flex-1 flex-col items-start justify-center rounded-md px-1.5 text-start outline-hidden focus-visible:ring-2 md:min-h-9"
                    onClick={() => onSelect(change.slide_id)}
                  >
                    <span className="text-xs font-medium">
                      {t("slideN", { n: position + 1 })}
                      {target && slideName(target) ? `: ${slideName(target)}` : ""}
                    </span>
                    <span className="text-muted-foreground w-full truncate text-xs">{change.instruction}</span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 md:size-9"
                    aria-label={t("removeChange", { n: position + 1 })}
                    onClick={() => revision.clear(change.slide_id)}
                  >
                    <Icons.close aria-hidden />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {blocked ? <p className="text-muted-foreground text-xs">{t("saveFirst")}</p> : null}
      {revision.error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(revision.error)}
        </p>
      ) : null}
      {created ? (
        <div role="status" className="bg-primary/10 flex flex-wrap items-center gap-2 rounded-lg p-2 text-sm">
          <Icons.check className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">{t("revised")}</span>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            onClick={() => revision.open(created)}
          >
            {tCommon("open")}
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        className="min-h-11 self-start md:min-h-8"
        disabled={pending.length === 0 || blocked || isPending}
        onClick={revision.generate}
      >
        {isPending ? <Icons.spinner className="animate-spin" aria-hidden /> : <Icons.sparkles aria-hidden />}
        {isPending ? t("generating") : t("generateRevised")}
      </Button>
    </section>
  )
}
