"use client"

import { getNotebooksQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { notebookHref, NOTEBOOKS_HREF } from "../../../notebooks/utils/hrefs"
import { useToday } from "../../hooks/use-today"
import type { Widget } from "../model"
import { WidgetFrame } from "../widget-frame"

/** Prompt templates in the messages (`notebookPrompt.templates.0` …); one is picked at random on every open. */
export const PROMPT_TEMPLATES = 4

/**
 * A suggestion for the student's notebooks, such as "Prepare for the midterm in Biology with flash cards". A random
 * template is picked each time the widget mounts; the tile opens the notebook.
 */
export function NotebookPromptWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const today = useToday().data
  const [index] = useState(() => Math.floor(Math.random() * PROMPT_TEMPLATES))
  const notebooks = useQuery(getNotebooksQuery())
  const subject = today?.now_or_next?.subject.name ?? today?.due[0]?.subject.name ?? t("anySubject")
  const text = t(`notebookPrompt.templates.${index}`, { subject })
  const notebookId = widget.config.notebook_id || notebooks.data?.items[0]?.id
  const href = notebookId ? notebookHref(notebookId) : NOTEBOOKS_HREF
  return (
    <WidgetFrame widget={widget} editing={editing} title={t("kinds.notebook_prompt")} href={href}>
      <span className="line-clamp-4 text-sm leading-snug font-medium" data-testid="notebook-prompt">
        {text}
      </span>
    </WidgetFrame>
  )
}
