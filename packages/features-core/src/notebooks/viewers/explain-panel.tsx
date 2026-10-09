"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
  cn,
  useIsMobile,
} from "@ihsp/ui"
import { IconX } from "@tabler/icons-react"
import { CitedMarkdown } from "../chat/cited-markdown"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import type { Explain } from "./use-explain"

/**
 * The "Explain" side panel (a bottom sheet on phones) shared by the flash cards and the quiz: it shows the cited
 * answer of the notebook chat to the question `explain.start(...)` asked.
 */
export function ExplainPanel({ explain }: { explain: Explain }) {
  const t = useT("notebooks")
  const errorMessage = useNotebookErrorMessage()
  const isMobile = useIsMobile()
  const { state } = explain

  return (
    <Sheet
      open={state.request !== null}
      onOpenChange={(open) => {
        if (!open) explain.close()
      }}
    >
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        showCloseButton={false}
        className={cn("gap-0", isMobile ? "max-h-[85dvh]" : "data-[side=right]:w-full data-[side=right]:sm:max-w-md")}
      >
        <SheetHeader className="flex-row items-start justify-between gap-2 border-b">
          <div className="flex min-w-0 flex-col gap-0.5">
            <SheetTitle>{t("viewers.explain.title")}</SheetTitle>
            <SheetDescription className="line-clamp-3 break-words">{state.request?.heading}</SheetDescription>
          </div>
          <SheetClose render={<Button type="button" variant="ghost" size="icon" className="-me-2 size-11" />}>
            <IconX aria-hidden />
            <span className="sr-only">{t("viewer.close")}</span>
          </SheetClose>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4" aria-live="polite" aria-busy={state.status === "loading"}>
          {state.status === "loading" ? (
            <div role="status" aria-label={t("chat.thinking")} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : null}
          {state.status === "error" ? (
            <div className="flex flex-col items-start gap-3">
              <p role="alert" className="text-destructive text-sm">
                {errorMessage(state.error)}
              </p>
              <Button type="button" variant="outline" className="min-h-11" onClick={explain.retry}>
                {t("viewers.explain.retry")}
              </Button>
            </div>
          ) : null}
          {state.status === "ready" && state.answer ? (
            <CitedMarkdown text={state.answer.text} citations={state.answer.citations} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
