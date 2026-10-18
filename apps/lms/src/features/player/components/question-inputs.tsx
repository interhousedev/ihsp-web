"use client"

import type { Answer } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dropdown, Icons, Input, Textarea } from "@ihsp/ui"
import { moveItem } from "../../step-editor/utils/content-ops"
import type { AttemptQuestion } from "../utils/answers"

type Props = {
  question: AttemptQuestion
  answer: Answer | undefined
  onChange: (answer: Answer | null) => void
  labelledBy: string
}

/** Sorting: the items come shuffled; the student moves them into order. */
export function SortingInput({ question, answer, onChange }: Props) {
  const t = useT("test")
  const options = question.options ?? []
  const byId = new Map(options.map((option) => [option.id, option]))
  const order = answer?.option_ids ?? options.map((option) => option.id)
  return (
    <ol className="flex flex-col gap-1.5">
      {order.map((id, index) => (
        <li key={id} className="flex min-h-11 items-center gap-2 rounded-md border px-3 py-1 text-sm">
          <span className="w-5">{index + 1}.</span>
          <span className="min-w-0 flex-1 break-words">{byId.get(id)?.text}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === 0}
            aria-label={t("moveUp", { item: byId.get(id)?.text ?? "" })}
            onClick={() => onChange({ option_ids: moveItem(order, index, index - 1) })}
            className="size-11 md:size-8"
          >
            <Icons.chevronUp aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === order.length - 1}
            aria-label={t("moveDown", { item: byId.get(id)?.text ?? "" })}
            onClick={() => onChange({ option_ids: moveItem(order, index, index + 1) })}
            className="size-11 md:size-8"
          >
            <Icons.chevronDown aria-hidden />
          </Button>
        </li>
      ))}
    </ol>
  )
}

/** Matching: each left item gets a right item from a list. */
export function MatchingInput({ question, answer, onChange }: Props) {
  const t = useT("test")
  const pairs = answer?.pairs ?? {}
  return (
    <ul className="flex flex-col gap-2">
      {(question.lefts ?? []).map((left) => (
        <li key={left.id} className="grid items-center gap-2 sm:grid-cols-2">
          <span className="text-sm break-words">{left.text}</span>
          <Dropdown
            aria-label={t("matchFor", { item: left.text })}
            value={pairs[left.id] ?? ""}
            onValueChange={(value) => {
              const next = { ...pairs }
              if (value === "") delete next[left.id]
              else next[left.id] = value
              onChange(Object.keys(next).length === 0 ? null : { pairs: next })
            }}
            className="w-full"
            options={[
              { value: "", label: t("choose") },
              ...(question.rights ?? []).map((right) => ({ value: right.id, label: right.text })),
            ]}
          />
        </li>
      ))}
    </ul>
  )
}

/** Table: tick the cells that fit. */
export function TableInput({ question, answer, onChange }: Props) {
  const t = useT("test")
  const table = question.table ?? { rows: [], columns: [] }
  const cells = answer?.cells ?? []
  return (
    <div className="overflow-x-auto">
      <table className="text-sm">
        <thead>
          <tr>
            <th />
            {table.columns.map((title, column) => (
              <th key={column} scope="col" className="px-2 py-1 font-medium">
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((title, row) => (
            <tr key={row}>
              <th scope="row" className="px-2 py-1 text-start font-medium">
                {title}
              </th>
              {table.columns.map((column, columnIndex) => {
                const key = `${row}:${columnIndex}`
                return (
                  <td key={key} className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      aria-label={t("cell", { row: title, column })}
                      checked={cells.includes(key)}
                      onChange={() => {
                        const next = cells.includes(key) ? cells.filter((c) => c !== key) : [...cells, key]
                        onChange(next.length === 0 ? null : { cells: next })
                      }}
                      className="accent-primary size-5"
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Fill blanks: one field per `{{n}}` of the prompt. */
export function BlanksInput({ question, answer, onChange }: Props) {
  const t = useT("test")
  const count = question.blanks ?? 0
  const texts = Array.from({ length: count }, (_, index) => answer?.texts?.[index] ?? "")
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {texts.map((text, index) => (
        <Input
          key={index}
          aria-label={t("blank", { number: index + 1 })}
          placeholder={t("blank", { number: index + 1 })}
          value={text}
          autoComplete="off"
          onChange={(event) => onChange({ texts: texts.map((value, i) => (i === index ? event.target.value : value)) })}
          className="h-11 md:h-8"
        />
      ))}
    </div>
  )
}

/** Math formula: a text expression. */
export function FormulaInput({ question, answer, onChange, labelledBy }: Props) {
  const t = useT("test")
  return (
    <div className="flex flex-col gap-1">
      <Input
        value={answer?.text ?? ""}
        onChange={(event) => onChange({ text: event.target.value })}
        aria-labelledby={labelledBy}
        placeholder={t("formulaPlaceholder")}
        autoComplete="off"
        className="h-11 font-mono md:h-8"
      />
      {question.variables?.length ? (
        <p className="text-muted-foreground text-xs">
          {t("formulaVariables", { names: question.variables.join(", ") })}
        </p>
      ) : null}
    </div>
  )
}

/** Free answer: long text for a teacher. */
export function FreeInput({ answer, onChange, labelledBy }: Props) {
  const t = useT("test")
  return (
    <div className="flex flex-col gap-1">
      <Textarea
        value={answer?.text ?? ""}
        onChange={(event) => onChange({ text: event.target.value })}
        aria-labelledby={labelledBy}
        rows={5}
      />
      <p className="text-muted-foreground text-xs">{t("reviewedByTeacher")}</p>
    </div>
  )
}

/** Programming: the code, plus the program output when the author compares outputs. No code is run. */
export function CodeInput({ question, answer, onChange, labelledBy }: Props) {
  const t = useT("test")
  const code = answer?.text ?? question.code?.starter ?? ""
  const output = answer?.output ?? ""
  const auto = question.code?.auto ?? false
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={code}
        onChange={(event) => onChange({ text: event.target.value, output })}
        aria-labelledby={labelledBy}
        rows={8}
        spellCheck={false}
        className="font-mono"
      />
      {auto ? (
        <Textarea
          value={output}
          onChange={(event) => onChange({ text: code, output: event.target.value })}
          aria-label={t("codeOutput")}
          placeholder={t("codeOutput")}
          rows={3}
          spellCheck={false}
          className="font-mono"
        />
      ) : (
        <p className="text-muted-foreground text-xs">{t("reviewedByTeacher")}</p>
      )}
    </div>
  )
}
