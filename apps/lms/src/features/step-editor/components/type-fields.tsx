"use client"

import type { Question } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  Icons,
  Input,
  NativeSelect,
  NativeSelectOption,
  Textarea,
} from "@ihsp/ui"
import { useId } from "react"
import { moveItem, newBlank, newOption, newPair, newVariable } from "../utils/content-ops"

type Props = {
  question: Question
  onChange: (question: Question) => void
  keyOf: (id: string) => string
}

const ROW = "flex items-center gap-2"

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className="min-h-11 w-fit md:min-h-7">
      <Icons.add aria-hidden />
      {label}
    </Button>
  )
}

function RemoveButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="size-11 md:size-8"
    >
      <Icons.trash aria-hidden />
    </Button>
  )
}

/** Sorting: the items in their correct order; students get them shuffled. */
export function SortingFields({ question, onChange, keyOf }: Props) {
  const t = useT("testBuilder")
  const options = question.options ?? []
  const set = (next: typeof options) => onChange({ ...question, options: next })
  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-2">
        {options.map((option, index) => (
          <li key={keyOf(option.id)} className={ROW}>
            <span className="w-6 text-sm">{index + 1}.</span>
            <Input
              aria-label={t("itemText", { number: index + 1 })}
              value={option.text}
              onChange={(event) =>
                set(options.map((o) => (o.id === option.id ? { ...o, text: event.target.value } : o)))
              }
              className="h-11 md:h-8"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === 0}
              aria-label={t("moveItemUp", { number: index + 1 })}
              onClick={() => set(moveItem(options, index, index - 1))}
              className="size-11 md:size-8"
            >
              <Icons.chevronUp aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={index === options.length - 1}
              aria-label={t("moveItemDown", { number: index + 1 })}
              onClick={() => set(moveItem(options, index, index + 1))}
              className="size-11 md:size-8"
            >
              <Icons.chevronDown aria-hidden />
            </Button>
            <RemoveButton
              label={t("removeItem", { number: index + 1 })}
              onClick={() => set(options.filter((o) => o.id !== option.id))}
              disabled={options.length <= 2}
            />
          </li>
        ))}
      </ol>
      <AddButton label={t("addItem")} onClick={() => set([...options, newOption()])} />
    </div>
  )
}

/** Matching: pairs of a left and a right item; students match the shuffled right column. */
export function MatchingFields({ question, onChange, keyOf }: Props) {
  const t = useT("testBuilder")
  const pairs = question.pairs ?? []
  const set = (next: typeof pairs) => onChange({ ...question, pairs: next })
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {pairs.map((pair, index) => (
          <li key={keyOf(pair.id)} className={ROW}>
            <Input
              aria-label={t("pairLeft", { number: index + 1 })}
              value={pair.left}
              onChange={(event) => set(pairs.map((p) => (p.id === pair.id ? { ...p, left: event.target.value } : p)))}
              className="h-11 md:h-8"
            />
            <Input
              aria-label={t("pairRight", { number: index + 1 })}
              value={pair.right}
              onChange={(event) => set(pairs.map((p) => (p.id === pair.id ? { ...p, right: event.target.value } : p)))}
              className="h-11 md:h-8"
            />
            <RemoveButton
              label={t("removePair", { number: index + 1 })}
              onClick={() => set(pairs.filter((p) => p.id !== pair.id))}
              disabled={pairs.length <= 2}
            />
          </li>
        ))}
      </ul>
      <AddButton label={t("addPair")} onClick={() => set([...pairs, newPair()])} />
    </div>
  )
}

/** Table: rows, columns and the cells students must mark. */
export function TableFields({ question, onChange }: Props) {
  const t = useT("testBuilder")
  const table = question.table ?? { rows: [], columns: [], correct: [] }
  const set = (rows: string[], columns: string[], correct: boolean[][]) =>
    onChange({ ...question, table: { rows, columns, correct } })
  const addRow = () => set([...table.rows, ""], table.columns, [...table.correct, table.columns.map(() => false)])
  const addColumn = () =>
    set(
      table.rows,
      [...table.columns, ""],
      table.correct.map((line) => [...line, false]),
    )
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr>
              <th />
              {table.columns.map((title, column) => (
                <th key={column} className="p-1">
                  <Input
                    aria-label={t("columnTitle", { number: column + 1 })}
                    value={title}
                    onChange={(event) =>
                      set(
                        table.rows,
                        table.columns.map((c, i) => (i === column ? event.target.value : c)),
                        table.correct,
                      )
                    }
                    className="h-11 min-w-24 md:h-8"
                  />
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {table.rows.map((title, row) => (
              <tr key={row}>
                <th className="p-1">
                  <Input
                    aria-label={t("rowTitle", { number: row + 1 })}
                    value={title}
                    onChange={(event) =>
                      set(
                        table.rows.map((r, i) => (i === row ? event.target.value : r)),
                        table.columns,
                        table.correct,
                      )
                    }
                    className="h-11 min-w-24 md:h-8"
                  />
                </th>
                {table.columns.map((_, column) => (
                  <td key={column} className="p-1 text-center">
                    <input
                      type="checkbox"
                      aria-label={t("cellCorrect", {
                        row: row + 1,
                        column: column + 1,
                      })}
                      checked={table.correct[row]?.[column] ?? false}
                      onChange={(event) =>
                        set(
                          table.rows,
                          table.columns,
                          table.correct.map((line, r) =>
                            line.map((v, c) => (r === row && c === column ? event.target.checked : v)),
                          ),
                        )
                      }
                      className="accent-primary size-5"
                    />
                  </td>
                ))}
                <td>
                  <RemoveButton
                    label={t("removeRow", { number: row + 1 })}
                    onClick={() =>
                      set(
                        table.rows.filter((_, i) => i !== row),
                        table.columns,
                        table.correct.filter((_, i) => i !== row),
                      )
                    }
                    disabled={table.rows.length <= 1}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <AddButton label={t("addRow")} onClick={addRow} />
        <AddButton label={t("addColumn")} onClick={addColumn} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={table.columns.length <= 1}
          onClick={() =>
            set(
              table.rows,
              table.columns.slice(0, -1),
              table.correct.map((line) => line.slice(0, -1)),
            )
          }
          className="min-h-11 md:min-h-7"
        >
          {t("removeColumn")}
        </Button>
      </div>
    </div>
  )
}

/** Fill blanks: the prompt holds {{1}}, {{2}} ...; each blank has accepted answers. */
export function BlanksFields({ question, onChange, keyOf }: Props) {
  const t = useT("testBuilder")
  const blanks = question.blanks ?? []
  const set = (next: typeof blanks) => onChange({ ...question, blanks: next })
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">{t("blanksHint")}</p>
      <ul className="flex flex-col gap-2">
        {blanks.map((blank, index) => (
          <li key={keyOf(blank.id)} className="flex flex-col gap-1 rounded-md border p-2">
            <div className={ROW}>
              <span className="text-sm font-medium">{t("blankNumber", { number: index + 1 })}</span>
              <RemoveButton
                label={t("removeBlank", { number: index + 1 })}
                onClick={() => set(blanks.filter((b) => b.id !== blank.id))}
                disabled={blanks.length <= 1}
              />
            </div>
            <Textarea
              aria-label={t("blankAccepted", { number: index + 1 })}
              value={blank.accepted.join("\n")}
              onChange={(event) =>
                set(blanks.map((b) => (b.id === blank.id ? { ...b, accepted: event.target.value.split("\n") } : b)))
              }
              rows={2}
            />
            <Input
              aria-label={t("blankRegex", { number: index + 1 })}
              placeholder={t("regex")}
              value={blank.regex ?? ""}
              onChange={(event) =>
                set(
                  blanks.map((b) =>
                    b.id === blank.id
                      ? {
                          ...b,
                          regex: event.target.value === "" ? null : event.target.value,
                        }
                      : b,
                  ),
                )
              }
              className="h-11 font-mono md:h-8"
            />
          </li>
        ))}
      </ul>
      <AddButton label={t("addBlank")} onClick={() => set([...blanks, newBlank()])} />
    </div>
  )
}

/** Random numeric: variables with ranges and the formula of the answer. */
export function RandomFields({ question, onChange }: Props) {
  const t = useT("testBuilder")
  const id = useId()
  const spec = question.random ?? { variables: [], formula: "", tolerance: 0 }
  const set = (next: typeof spec) => onChange({ ...question, random: next })
  const setVar = (index: number, patch: Partial<(typeof spec.variables)[number]>) =>
    set({
      ...spec,
      variables: spec.variables.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    })
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">{t("randomHint")}</p>
      <ul className="flex flex-col gap-2">
        {spec.variables.map((variable, index) => (
          <li key={index} className="flex flex-wrap items-center gap-2">
            <Input
              aria-label={t("variableName", { number: index + 1 })}
              value={variable.name}
              onChange={(event) => setVar(index, { name: event.target.value })}
              className="h-11 w-20 font-mono md:h-8"
            />
            <Input
              type="number"
              step="any"
              aria-label={t("variableMin", { number: index + 1 })}
              value={variable.min}
              onChange={(event) => setVar(index, { min: Number(event.target.value) })}
              className="h-11 w-24 md:h-8"
            />
            <Input
              type="number"
              step="any"
              aria-label={t("variableMax", { number: index + 1 })}
              value={variable.max}
              onChange={(event) => setVar(index, { max: Number(event.target.value) })}
              className="h-11 w-24 md:h-8"
            />
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={variable.integer}
                onChange={(event) => setVar(index, { integer: event.target.checked })}
                className="accent-primary size-4"
              />
              {t("variableInteger")}
            </label>
            <RemoveButton
              label={t("removeVariable", { number: index + 1 })}
              onClick={() =>
                set({
                  ...spec,
                  variables: spec.variables.filter((_, i) => i !== index),
                })
              }
            />
          </li>
        ))}
      </ul>
      <AddButton
        label={t("addVariable")}
        onClick={() =>
          set({
            ...spec,
            variables: [...spec.variables, newVariable(String.fromCharCode(97 + spec.variables.length))],
          })
        }
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <Field>
          <FieldLabel htmlFor={`${id}-formula`}>{t("answerFormula")}</FieldLabel>
          <Input
            id={`${id}-formula`}
            value={spec.formula}
            onChange={(event) => set({ ...spec, formula: event.target.value })}
            className="h-11 font-mono md:h-8"
          />
          <FieldDescription>{t("answerFormulaHint")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-tol`}>{t("tolerance")}</FieldLabel>
          <Input
            id={`${id}-tol`}
            type="number"
            step="any"
            min={0}
            value={spec.tolerance}
            onChange={(event) => set({ ...spec, tolerance: Number(event.target.value) || 0 })}
            className="h-11 md:h-8"
          />
        </Field>
      </div>
    </div>
  )
}

/** Math formula: the expected expression, compared symbolically or numerically. */
export function FormulaFields({ question, onChange }: Props) {
  const t = useT("testBuilder")
  const id = useId()
  const spec = question.formula ?? {
    expression: "",
    variables: ["x"],
    mode: "symbolic" as const,
    tolerance: 0.000001,
  }
  const set = (next: typeof spec) => onChange({ ...question, formula: next })
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`${id}-expr`}>{t("expectedExpression")}</FieldLabel>
        <Input
          id={`${id}-expr`}
          value={spec.expression}
          onChange={(event) => set({ ...spec, expression: event.target.value })}
          className="h-11 font-mono md:h-8"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-vars`}>{t("formulaVariables")}</FieldLabel>
        <Input
          id={`${id}-vars`}
          value={spec.variables.join(", ")}
          onChange={(event) =>
            set({
              ...spec,
              variables: event.target.value
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean),
            })
          }
          className="h-11 font-mono md:h-8"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-mode`}>{t("compareMode")}</FieldLabel>
        <NativeSelect
          id={`${id}-mode`}
          value={spec.mode}
          onChange={(event) =>
            set({
              ...spec,
              mode: event.target.value === "numeric" ? "numeric" : "symbolic",
            })
          }
          className="w-full"
        >
          <NativeSelectOption value="symbolic">{t("modeSymbolic")}</NativeSelectOption>
          <NativeSelectOption value="numeric">{t("modeNumeric")}</NativeSelectOption>
        </NativeSelect>
      </Field>
    </div>
  )
}

/** Programming: nothing is run; expected outputs are compared, or a reviewer scores the answer. */
export function CodeFields({ question, onChange }: Props) {
  const t = useT("testBuilder")
  const id = useId()
  const spec = question.code ?? {
    language: "python",
    starter: "",
    expected_outputs: [],
  }
  const set = (next: typeof spec) => onChange({ ...question, code: next })
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">{t("codeHint")}</p>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Field>
          <FieldLabel htmlFor={`${id}-lang`}>{t("codeLanguage")}</FieldLabel>
          <Input
            id={`${id}-lang`}
            value={spec.language}
            onChange={(event) => set({ ...spec, language: event.target.value })}
            className="h-11 md:h-8"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-starter`}>{t("codeStarter")}</FieldLabel>
          <Textarea
            id={`${id}-starter`}
            value={spec.starter}
            onChange={(event) => set({ ...spec, starter: event.target.value })}
            rows={3}
            className="font-mono"
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor={`${id}-out`}>{t("expectedOutputs")}</FieldLabel>
        <Textarea
          id={`${id}-out`}
          value={spec.expected_outputs.join("\n---\n")}
          onChange={(event) =>
            set({
              ...spec,
              expected_outputs: event.target.value === "" ? [] : event.target.value.split("\n---\n"),
            })
          }
          rows={3}
          className="font-mono"
        />
        <FieldDescription>{t("expectedOutputsHint")}</FieldDescription>
      </Field>
    </div>
  )
}
