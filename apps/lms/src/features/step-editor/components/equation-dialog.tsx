"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  MathFormula,
  mathError,
  Textarea,
  useKatex,
} from "@ihsp/ui"
import { IconAlertTriangle } from "@ihsp/ui"
import { type FormEvent, type KeyboardEvent, type RefObject, useId, useRef, useState } from "react"
import type { Formula } from "../utils/markdown/math-format"

/** Common formulas; `select` is the part selected after inserting, ready to be typed over. */
const TEMPLATES = [
  { name: "fraction", latex: "\\frac{a}{b}", select: "a" },
  { name: "root", latex: "\\sqrt{x}", select: "x" },
  { name: "power", latex: "x^{2}", select: "2" },
  { name: "subscript", latex: "x_{i}", select: "i" },
  { name: "sum", latex: "\\sum_{i=1}^{n} a_i", select: "a_i" },
  { name: "integral", latex: "\\int_{a}^{b} f(x)\\,dx", select: "f(x)" },
  { name: "limit", latex: "\\lim_{x \\to 0} f(x)", select: "f(x)" },
  { name: "matrix", latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", select: "a" },
] as const

/**
 * Writes or edits a formula: LaTeX with a live KaTeX preview, in the text or on its own line, with templates for
 * common formulas. Invalid LaTeX shows KaTeX's reason and can't be inserted. Ctrl/⌘+Enter inserts.
 */
export function EquationDialog({
  initial,
  editing,
  onSubmit,
  onCancel,
  returnFocus,
}: {
  initial: Formula
  editing: boolean
  /** Writes the formula; `false` when it can't be written into the text. */
  onSubmit: (formula: Formula) => boolean
  onCancel: () => void
  returnFocus: RefObject<HTMLElement | null>
}) {
  const t = useT("markdownEditor.equationDialog")
  const id = useId()
  const katex = useKatex()
  const field = useRef<HTMLTextAreaElement>(null)
  const [latex, setLatex] = useState(initial.latex)
  const [display, setDisplay] = useState(initial.display)
  const [unwritable, setUnwritable] = useState(false)
  const source = latex.trim()
  const error = katex && source !== "" ? mathError(katex, source, display) : null
  const canInsert = source !== "" && error === null

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!canInsert) return
    setUnwritable(!onSubmit({ latex: source, display }))
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
  }

  function insertTemplate(template: (typeof TEMPLATES)[number]) {
    const textarea = field.current
    const start = textarea?.selectionStart ?? latex.length
    const end = textarea?.selectionEnd ?? latex.length
    const next = latex.slice(0, start) + template.latex + latex.slice(end)
    setLatex(next)
    setUnwritable(false)
    const selectFrom = start + template.latex.indexOf(template.select)
    requestAnimationFrame(() => {
      field.current?.focus()
      field.current?.setSelectionRange(selectFrom, selectFrom + template.select.length)
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-xl" initialFocus={field} finalFocus={returnFocus}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{editing ? t("editTitle") : t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t("placement")}</legend>
            <div className="bg-muted inline-flex w-fit rounded-lg p-0.5" role="radiogroup" aria-label={t("placement")}>
              {([false, true] as const).map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  role="radio"
                  aria-checked={display === value}
                  tabIndex={display === value ? 0 : -1}
                  onClick={() => setDisplay(value)}
                  onKeyDown={(event) => {
                    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return
                    event.preventDefault()
                    setDisplay(!value)
                    const group = event.currentTarget.parentElement
                    requestAnimationFrame(() => group?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus())
                  }}
                  className="aria-checked:bg-background aria-checked:text-foreground text-muted-foreground focus-visible:ring-ring/50 min-h-11 rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 aria-checked:shadow-sm md:pointer-fine:min-h-8"
                >
                  {value ? t("display") : t("inline")}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium" id={`${id}-templates`}>
              {t("templates")}
            </span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="group" aria-labelledby={`${id}-templates`}>
              {TEMPLATES.map((template) => (
                <Button
                  key={template.name}
                  type="button"
                  variant="outline"
                  onClick={() => insertTemplate(template)}
                  aria-label={t("insertTemplate", { name: t(template.name), latex: template.latex })}
                  title={template.latex}
                  className="h-auto min-h-11 flex-col gap-0.5 py-1.5 md:pointer-fine:min-h-8"
                >
                  <span aria-hidden className="pointer-events-none max-w-full overflow-hidden text-[0.8rem]">
                    <MathFormula source={template.latex} />
                  </span>
                  <span aria-hidden className="text-muted-foreground text-xs">
                    {t(template.name)}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <Field>
            <FieldLabel htmlFor={`${id}-latex`}>{t("latex")}</FieldLabel>
            <Textarea
              ref={field}
              id={`${id}-latex`}
              value={latex}
              onChange={(event) => {
                setLatex(event.target.value)
                setUnwritable(false)
              }}
              onKeyDown={onKeyDown}
              rows={3}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-invalid={error !== null || unwritable}
              aria-describedby={`${id}-preview`}
              className="font-mono"
            />
          </Field>

          <section aria-labelledby={`${id}-preview-title`} className="flex flex-col gap-2">
            <h3 id={`${id}-preview-title`} className="text-sm font-medium">
              {t("preview")}
            </h3>
            <div
              id={`${id}-preview`}
              aria-live="polite"
              className="bg-muted/40 flex min-h-20 items-center justify-center overflow-x-auto rounded-lg border p-3"
            >
              {source === "" ? (
                <p className="text-muted-foreground text-sm">{t("previewEmpty")}</p>
              ) : !katex ? (
                <p className="text-muted-foreground text-sm">{t("loading")}</p>
              ) : error !== null || unwritable ? (
                <p className="text-destructive flex items-start gap-1.5 text-sm" data-testid="equation-error">
                  <IconAlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {unwritable ? t("cannotWrite") : t("error", { message: error ?? "" })}
                </p>
              ) : (
                <MathFormula source={source} display={display} className="my-0 w-full" />
              )}
            </div>
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} className="min-h-11 md:min-h-8">
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!canInsert} className="min-h-11 md:min-h-8">
              {editing ? t("save") : t("insert")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
