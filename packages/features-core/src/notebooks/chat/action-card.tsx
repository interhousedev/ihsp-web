"use client"

import type { ArtifactCreate } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Spinner } from "@ihsp/ui"
import { IconSparkles } from "@tabler/icons-react"
import { useId, useState } from "react"
import { useCreateArtifact } from "../api"
import { artifactKindKey, useNotebookErrorMessage } from "../lib"
import { useWorkspace } from "../workspace-context"

/** Option names whose values have labels under `notebooks.opt.<name>.<value>`. */
const LABELLED_OPTIONS = ["count", "difficulty", "detail", "style"] as const

type Translator = ReturnType<typeof useT>

function optionsOf(create: ArtifactCreate): Record<string, unknown> {
  // The options are a union of per-kind shapes; the card only reads their string fields.
  return (create.options ?? {}) as Record<string, unknown>
}

/** The kind (or, for a report, its format) as the Studio names it. */
function kindLabel(t: Translator, create: ArtifactCreate): string {
  const format = create.kind === "report" ? create.options.format : null
  if (format && format !== "custom" && t.has(`format.${format}`)) return t(`format.${format}`)
  return t(`kind.${artifactKindKey({ kind: create.kind, format: format ?? null })}`)
}

function describeOptions(t: Translator, create: ArtifactCreate): { label: string; value: string }[] {
  const options = optionsOf(create)
  const lines: { label: string; value: string }[] = []
  for (const name of LABELLED_OPTIONS) {
    const value = options[name]
    if (typeof value === "string" && t.has(`opt.${name}.${value}`)) {
      lines.push({ label: t(`opt.${name}.label`), value: t(`opt.${name}.${value}`) })
    }
  }
  const language = options.language
  if (typeof language === "string" && language !== "auto") lines.push({ label: t("opt.language"), value: language })
  return lines
}

type ActionCardProps = {
  notebookId: string
  /** The Studio output the assistant proposed in its answer (P2). */
  create: ArtifactCreate
  onDismiss: () => void
}

/** A proposed Studio output under an answer: the kind and its options with **Create** and **Cancel**. */
export function ActionCard({ notebookId, create, onDismiss }: ActionCardProps) {
  const t = useT("notebooks")
  const tc = useT("common")
  const titleId = useId()
  const errorMessage = useNotebookErrorMessage()
  const workspace = useWorkspace()
  const mutation = useCreateArtifact(notebookId)
  const [created, setCreated] = useState(false)

  const kind = kindLabel(t, create)
  const options = describeOptions(t, create)

  return (
    <div role="group" aria-labelledby={titleId} className="bg-card flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex items-start gap-2">
        <IconSparkles className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p id={titleId} className="text-sm font-medium">
            {t("chat.action.title", { kind })}
          </p>
          {options.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {options.map((option) => (
                <li key={option.label} className="bg-muted rounded-full px-2 py-0.5 text-xs">
                  <span className="text-muted-foreground">{option.label}</span> <span>{option.value}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {create.prompt ? (
            <p className="text-muted-foreground text-xs break-words">
              {t("chat.action.focus", { prompt: create.prompt })}
            </p>
          ) : null}
        </div>
      </div>
      {created ? (
        <p role="status" className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
          {t("chat.action.created", { kind })}
          <Button
            type="button"
            variant="link"
            className="h-auto min-h-11 p-0 md:min-h-0"
            onClick={() => workspace.showTab("studio")}
          >
            {t("chat.quick.open")}
          </Button>
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11 md:min-h-8"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(create, { onSuccess: () => setCreated(true) })}
          >
            {mutation.isPending ? <Spinner aria-hidden /> : null}
            {tc("create")}
          </Button>
          <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onDismiss}>
            {tc("cancel")}
          </Button>
        </div>
      )}
      {mutation.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(mutation.error)}
        </p>
      ) : null}
    </div>
  )
}
