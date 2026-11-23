"use client"

import type { ExamCalculator, ExamKind, ExamModule, ExamSection } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dropdown, Field, FieldLabel, Icons, Input } from "@ihsp/ui"
import { useId, useState } from "react"
import { moveItem, newQuestion, type ExamBlock } from "../utils/content-ops"
import {
  EXAM_MAX_MODULES,
  EXAM_MAX_SECTIONS,
  EXAM_QUESTION_TYPES,
  applyPreset,
  newExamModule,
  newExamSection,
} from "./exam/presets"
import { MarkdownEditor } from "./markdown-editor"
import { QuestionEditor } from "./question-editor"

const KINDS: readonly ExamKind[] = ["sat", "ap", "custom"]
const CALCULATORS: readonly ExamCalculator[] = ["none", "scientific", "graphing"]

/** The exam builder: preset, sections of timed modules, directions, reference sheet, calculator. */
export function ExamBlockEditor({
  block,
  onChange,
}: {
  block: ExamBlock
  onChange: (block: ExamBlock) => void
  courseId?: string
  stepId?: string
}) {
  const t = useT("examBuilder")
  const ids = { title: useId(), kind: useId(), calc: useId(), min: useId(), max: useId() }
  const setSection = (index: number, section: ExamSection) =>
    onChange({ ...block, sections: block.sections.map((item, i) => (i === index ? section : item)) })

  return (
    <div className="flex flex-col gap-4" data-block-id={block.id}>
      <div className="grid gap-3 md:grid-cols-3">
        <Field>
          <FieldLabel htmlFor={ids.title}>{t("title")}</FieldLabel>
          <Input
            id={ids.title}
            value={block.title}
            maxLength={200}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            className="h-11 md:h-8"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={ids.kind}>{t("kind")}</FieldLabel>
          <Dropdown
            id={ids.kind}
            value={block.kind}
            onValueChange={(value) => {
              const kind = KINDS.find((item) => item === value)
              if (kind) onChange(applyPreset(block, kind))
            }}
            className="w-full"
            options={KINDS.map((kind) => ({ value: kind, label: t(`kinds.${kind}`) }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={ids.calc}>{t("calculator")}</FieldLabel>
          <Dropdown
            id={ids.calc}
            value={block.calculator}
            onValueChange={(value) => {
              const calculator = CALCULATORS.find((item) => item === value)
              if (calculator) onChange({ ...block, calculator })
            }}
            className="w-full"
            options={CALCULATORS.map((c) => ({ value: c, label: t(`calculators.${c}`) }))}
          />
        </Field>
      </div>
      <p className="text-muted-foreground text-xs">{t("presetHint")}</p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-5"
            checked={block.scaling !== null}
            onChange={(e) =>
              onChange({ ...block, scaling: e.target.checked ? { min_score: 200, max_score: 800 } : null })
            }
          />
          {t("scaled")}
        </label>
        {block.scaling ? (
          <>
            <Field className="w-28">
              <FieldLabel htmlFor={ids.min}>{t("scaleMin")}</FieldLabel>
              <Input
                id={ids.min}
                type="number"
                value={block.scaling.min_score}
                onChange={(e) =>
                  block.scaling &&
                  onChange({ ...block, scaling: { ...block.scaling, min_score: Number(e.target.value) } })
                }
                className="h-11 md:h-8"
              />
            </Field>
            <Field className="w-28">
              <FieldLabel htmlFor={ids.max}>{t("scaleMax")}</FieldLabel>
              <Input
                id={ids.max}
                type="number"
                value={block.scaling.max_score}
                onChange={(e) =>
                  block.scaling &&
                  onChange({ ...block, scaling: { ...block.scaling, max_score: Number(e.target.value) } })
                }
                className="h-11 md:h-8"
              />
            </Field>
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("directions")}</span>
        <MarkdownEditor
          value={block.directions}
          onChange={(directions) => onChange({ ...block, directions })}
          label={t("directions")}
          rows={4}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("referenceSheet")}</span>
        <MarkdownEditor
          value={block.reference_sheet}
          onChange={(reference_sheet) => onChange({ ...block, reference_sheet })}
          label={t("referenceSheet")}
          rows={4}
        />
      </div>

      <ol className="flex flex-col gap-4">
        {block.sections.map((section, index) => (
          <SectionEditor
            key={section.id}
            section={section}
            index={index}
            onChange={(next) => setSection(index, next)}
            onRemove={() => onChange({ ...block, sections: block.sections.filter((item) => item.id !== section.id) })}
          />
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={block.sections.length >= EXAM_MAX_SECTIONS}
        onClick={() =>
          onChange({
            ...block,
            sections: [
              ...block.sections,
              newExamSection(t("sectionDefault", { number: block.sections.length + 1 }), [
                newExamModule("Module 1", 30),
              ]),
            ],
          })
        }
        className="w-fit min-h-11 md:min-h-7"
      >
        <Icons.add aria-hidden />
        {t("addSection")}
      </Button>
    </div>
  )
}

function SectionEditor({
  section,
  index,
  onChange,
  onRemove,
}: {
  section: ExamSection
  index: number
  onChange: (section: ExamSection) => void
  onRemove: () => void
}) {
  const t = useT("examBuilder")
  const titleId = useId()
  const setModule = (i: number, module: ExamModule) =>
    onChange({ ...section, modules: section.modules.map((item, j) => (j === i ? module : item)) })
  return (
    <li className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field className="min-w-48 flex-1">
          <FieldLabel htmlFor={titleId}>{t("sectionTitle", { number: index + 1 })}</FieldLabel>
          <Input
            id={titleId}
            value={section.title}
            maxLength={200}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            className="h-11 md:h-8"
          />
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
          <input
            type="checkbox"
            className="accent-primary size-5"
            checked={section.adaptive}
            onChange={(e) => onChange({ ...section, adaptive: e.target.checked })}
          />
          {t("adaptive")}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={t("removeSection", { number: index + 1 })}
          className="size-11 md:size-8"
        >
          <Icons.trash aria-hidden />
        </Button>
      </div>
      {section.adaptive ? <p className="text-muted-foreground text-xs">{t("adaptiveHint")}</p> : null}
      <ol className="flex flex-col gap-3">
        {section.modules.map((module, i) => (
          <ModuleEditor
            key={module.id}
            module={module}
            index={i}
            onChange={(next) => setModule(i, next)}
            onRemove={() => onChange({ ...section, modules: section.modules.filter((item) => item.id !== module.id) })}
          />
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={section.modules.length >= EXAM_MAX_MODULES}
        onClick={() =>
          onChange({
            ...section,
            modules: [...section.modules, newExamModule(`Module ${section.modules.length + 1}`, 30)],
          })
        }
        className="w-fit min-h-11 md:min-h-7"
      >
        <Icons.add aria-hidden />
        {t("addModule")}
      </Button>
    </li>
  )
}

function ModuleEditor({
  module,
  index,
  onChange,
  onRemove,
}: {
  module: ExamModule
  index: number
  onChange: (module: ExamModule) => void
  onRemove: () => void
}) {
  const t = useT("examBuilder")
  const titleId = useId()
  const minutesId = useId()
  const [open, setOpen] = useState(index === 0)
  const minutes = Math.round(module.time_limit_sec / 60)
  return (
    <li className="bg-muted/30 flex flex-col gap-3 rounded-md border p-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field className="min-w-40 flex-1">
          <FieldLabel htmlFor={titleId}>{t("moduleTitle", { number: index + 1 })}</FieldLabel>
          <Input
            id={titleId}
            value={module.title}
            maxLength={200}
            onChange={(e) => onChange({ ...module, title: e.target.value })}
            className="h-11 md:h-8"
          />
        </Field>
        <Field className="w-28">
          <FieldLabel htmlFor={minutesId}>{t("minutes")}</FieldLabel>
          <Input
            id={minutesId}
            type="number"
            min={1}
            max={240}
            value={minutes}
            onChange={(e) =>
              onChange({ ...module, time_limit_sec: Math.min(240, Math.max(1, Number(e.target.value) || 1)) * 60 })
            }
            className="h-11 md:h-8"
          />
        </Field>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="min-h-11 md:min-h-8"
        >
          {open ? <Icons.chevronUp aria-hidden /> : <Icons.chevronDown aria-hidden />}
          {t("questions", { count: module.questions.length })}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={t("removeModule", { number: index + 1 })}
          className="size-11 md:size-8"
        >
          <Icons.trash aria-hidden />
        </Button>
      </div>
      {open ? (
        <>
          <ol className="flex flex-col gap-3">
            {module.questions.map((question, qi) => (
              <QuestionEditor
                key={question.id}
                question={question}
                index={qi}
                total={module.questions.length}
                keyOf={(id) => id}
                types={EXAM_QUESTION_TYPES}
                onChange={(next) =>
                  onChange({ ...module, questions: module.questions.map((q) => (q.id === question.id ? next : q)) })
                }
                onMove={(direction) =>
                  onChange({
                    ...module,
                    questions: moveItem(module.questions, qi, direction === "up" ? qi - 1 : qi + 1),
                  })
                }
                onRemove={() =>
                  onChange({ ...module, questions: module.questions.filter((q) => q.id !== question.id) })
                }
              />
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...module, questions: [...module.questions, newQuestion("single")] })}
            className="w-fit min-h-11 md:min-h-7"
          >
            <Icons.add aria-hidden />
            {t("addQuestion")}
          </Button>
        </>
      ) : null}
    </li>
  )
}
