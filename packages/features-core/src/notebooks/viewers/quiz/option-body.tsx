"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { IconCheck, IconCircleCheck, IconCircleX } from "@ihsp/ui"

type OptionState = {
  /** The option is part of the student's answer (or, before checking, of the current choice). */
  selected: boolean
  /** The answer was checked: right and wrong options are marked. */
  revealed: boolean
  correct: boolean
}

/** Card classes of an option; colours come with an icon and a text label, never alone. */
export function optionClasses({ selected, revealed, correct }: OptionState): string {
  return cn(
    "flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-start text-base transition-colors motion-reduce:transition-none md:min-h-12",
    !revealed && (selected ? "border-primary bg-primary/10" : "bg-card hover:bg-muted"),
    revealed && correct && "border-green-600 bg-green-600/10 dark:border-green-500",
    revealed && !correct && selected && "border-destructive bg-destructive/10",
    revealed && !correct && !selected && "bg-card text-muted-foreground",
  )
}

type OptionBodyProps = OptionState & {
  text: string
  kind: "radio" | "checkbox"
}

/** What is inside an option card: the indicator (or the right/wrong icon), the text and the labels of a checked option. */
export function OptionBody({ text, kind, selected, revealed, correct }: OptionBodyProps) {
  const t = useT("notebooks")
  const labels = [
    revealed && selected ? t("viewers.quiz.yourAnswer") : null,
    revealed && correct ? t("viewers.quiz.correctOption") : null,
    revealed && selected && !correct ? t("quiz.wrong") : null,
  ].filter((label): label is string => label !== null)

  return (
    <>
      <span aria-hidden className="flex size-6 shrink-0 items-center justify-center">
        {revealed && correct ? (
          <IconCircleCheck className="size-6 text-green-600 dark:text-green-500" />
        ) : revealed && selected ? (
          <IconCircleX className="text-destructive size-6" />
        ) : (
          <span
            className={cn(
              "flex size-5 items-center justify-center border-2",
              kind === "radio" ? "rounded-full" : "rounded-md",
              selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50",
            )}
          >
            {selected ? (
              kind === "checkbox" ? (
                <IconCheck className="size-3.5" />
              ) : (
                <span className="bg-primary-foreground size-2 rounded-full" />
              )
            ) : null}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words">{text}</span>
        {labels.length > 0 ? (
          <span className="text-muted-foreground text-xs font-medium">{labels.join(" · ")}</span>
        ) : null}
      </span>
    </>
  )
}
