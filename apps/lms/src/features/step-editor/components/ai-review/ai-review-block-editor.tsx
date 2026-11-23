"use client"

import type { AiReviewBlock, AiReviewCriterion, AiReviewFileKind } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldLabel,
  Icons,
  Input,
  Switch,
  Textarea,
  cn,
} from "@ihsp/ui"
import { type KeyboardEvent, useEffect, useId, useState } from "react"
import { UploadZone } from "../../../player/components/ai-review/upload-zone"
import { useAiReviewUploads } from "../../../player/hooks/use-ai-review-uploads"
import { AI_REVIEW_FILE_KINDS, AI_REVIEW_TEMPLATES, acceptAttribute } from "../../../player/utils/ai-review"
import { AiReviewSubmissions } from "./ai-review-submissions"
import { TemplatePreview } from "./template-preview"

const MAX_CRITERIA = 20
const MAX_TOPICS = 30
const MAX_REFERENCE_FILES = 10

/**
 * The AI reviewer of a step (intermediate project review): what students see, the hidden instructions for the
 * reviewer, the review template, criteria, sources and limits. Staff open the students' work from here.
 */
export function AiReviewBlockEditor({
  block,
  onChange,
  courseId,
  stepId,
}: {
  block: AiReviewBlock
  onChange: (block: AiReviewBlock) => void
  courseId?: string
  stepId?: string
}) {
  const t = useT("stepEditor")
  const ids = {
    title: useId(),
    instructions: useId(),
    prompt: useId(),
    topic: useId(),
    max: useId(),
    pass: useId(),
    materials: useId(),
    web: useId(),
    criteria: useId(),
  }
  const [topic, setTopic] = useState("")
  const [showSubmissions, setShowSubmissions] = useState(false)
  const uploads = useAiReviewUploads(AI_REVIEW_FILE_KINDS, MAX_REFERENCE_FILES - block.reference_files.length)
  const saved = !block.id.startsWith("tmp-") && courseId && stepId

  // A finished upload becomes a reference file of the block.
  const { items, remove } = uploads
  useEffect(() => {
    const done = items.filter((item) => item.status === "done" && item.fileId)
    if (done.length === 0) return
    onChange({
      ...block,
      reference_files: [
        ...block.reference_files,
        ...done.map((item) => ({ file_id: item.fileId ?? "", name: item.name.slice(0, 200) })),
      ].slice(0, MAX_REFERENCE_FILES),
    })
    for (const item of done) remove(item.key)
  }, [items, block, onChange, remove])

  function setCriterion(index: number, change: Partial<AiReviewCriterion>) {
    onChange({
      ...block,
      criteria: block.criteria.map((criterion, at) => (at === index ? { ...criterion, ...change } : criterion)),
    })
  }

  function addTopic() {
    const value = topic.trim().slice(0, 200)
    if (!value || block.private_topics.includes(value) || block.private_topics.length >= MAX_TOPICS) return
    onChange({ ...block, private_topics: [...block.private_topics, value] })
    setTopic("")
  }

  function onTopicKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault()
      addTopic()
    }
  }

  function toggleKind(kind: AiReviewFileKind, on: boolean) {
    const next = on
      ? AI_REVIEW_FILE_KINDS.filter((item) => item === kind || block.accepted_types.includes(item))
      : block.accepted_types.filter((item) => item !== kind)
    if (next.length > 0) onChange({ ...block, accepted_types: next })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4" aria-labelledby={`${ids.title}-public`}>
        <h3 id={`${ids.title}-public`} className="flex items-center gap-2 text-sm font-semibold">
          <Icons.eye aria-hidden className="size-4" />
          {t("aiReview.publicSection")}
        </h3>
        <Field>
          <FieldLabel htmlFor={ids.title}>{t("aiReview.titleLabel")}</FieldLabel>
          <Input
            id={ids.title}
            value={block.title}
            maxLength={200}
            onChange={(event) => onChange({ ...block, title: event.target.value })}
            className="h-11 md:h-8"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={ids.instructions}>{t("aiReview.instructions")}</FieldLabel>
          <Textarea
            id={ids.instructions}
            value={block.instructions_public}
            maxLength={10_000}
            rows={4}
            onChange={(event) => onChange({ ...block, instructions_public: event.target.value })}
          />
          <FieldDescription>{t("aiReview.instructionsHint")}</FieldDescription>
        </Field>
      </section>

      <section
        className="border-warning/50 bg-warning/5 flex flex-col gap-4 rounded-lg border p-4"
        aria-labelledby={`${ids.prompt}-private`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 id={`${ids.prompt}-private`} className="flex items-center gap-2 text-sm font-semibold">
            <Icons.lock aria-hidden className="size-4" />
            {t("aiReview.privateSection")}
          </h3>
          <Badge variant="outline" className="border-warning/60">
            <Icons.eyeOff aria-hidden />
            {t("aiReview.hidden")}
          </Badge>
        </div>
        <Field>
          <FieldLabel htmlFor={ids.prompt}>{t("aiReview.prompt")}</FieldLabel>
          <Textarea
            id={ids.prompt}
            value={block.teacher_prompt}
            maxLength={10_000}
            rows={6}
            placeholder={t("aiReview.promptPlaceholder")}
            onChange={(event) => onChange({ ...block, teacher_prompt: event.target.value })}
          />
          <FieldDescription>{t("aiReview.promptHint")}</FieldDescription>
        </Field>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t("aiReview.referenceFiles")}</p>
          {block.reference_files.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {block.reference_files.map((file) => (
                <li
                  key={file.file_id}
                  className="bg-background flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                >
                  <Icons.page aria-hidden className="text-muted-foreground size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{file.name || file.file_id}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("aiReview.removeFile", { name: file.name })}
                    onClick={() =>
                      onChange({
                        ...block,
                        reference_files: block.reference_files.filter((item) => item.file_id !== file.file_id),
                      })
                    }
                    className="size-11 md:size-7"
                  >
                    <Icons.close aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          {block.reference_files.length < MAX_REFERENCE_FILES ? (
            <UploadZone
              items={uploads.items}
              refused={uploads.refused}
              accept={acceptAttribute(AI_REVIEW_FILE_KINDS)}
              hint={t("aiReview.referenceHint", { max: MAX_REFERENCE_FILES })}
              compact
              onFiles={(files) => uploads.add(files, uploads.items.length)}
              onRemove={uploads.remove}
            />
          ) : null}
        </div>

        <Field>
          <FieldLabel htmlFor={ids.topic}>{t("aiReview.topics")}</FieldLabel>
          {block.private_topics.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label={t("aiReview.topics")}>
              {block.private_topics.map((item) => (
                <li key={item}>
                  <Badge variant="secondary" className="h-auto gap-1 py-0.5 ps-2.5 pe-0.5">
                    <span className="max-w-60 truncate">{item}</span>
                    <button
                      type="button"
                      aria-label={t("aiReview.removeTopic", { topic: item })}
                      onClick={() =>
                        onChange({ ...block, private_topics: block.private_topics.filter((other) => other !== item) })
                      }
                      className="hover:bg-muted-foreground/20 flex size-7 items-center justify-center rounded-full md:size-5"
                    >
                      <Icons.close aria-hidden className="size-3" />
                    </button>
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex gap-2">
            <Input
              id={ids.topic}
              value={topic}
              maxLength={200}
              placeholder={t("aiReview.topicPlaceholder")}
              onChange={(event) => setTopic(event.target.value)}
              onKeyDown={onTopicKey}
              disabled={block.private_topics.length >= MAX_TOPICS}
              className="h-11 md:h-8"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addTopic}
              disabled={!topic.trim() || block.private_topics.length >= MAX_TOPICS}
              className="min-h-11 md:min-h-8"
            >
              <Icons.add aria-hidden />
              {t("aiReview.addTopic")}
            </Button>
          </div>
          <FieldDescription>{t("aiReview.topicsHint")}</FieldDescription>
        </Field>
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{t("aiReview.template")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {AI_REVIEW_TEMPLATES.map((template) => {
            const checked = block.output_template === template
            return (
              <label
                key={template}
                className={cn(
                  "has-[:focus-visible]:ring-ring/50 flex cursor-pointer flex-col gap-2 rounded-lg border p-3 has-[:focus-visible]:ring-3",
                  checked ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`${ids.title}-template`}
                    value={template}
                    checked={checked}
                    onChange={() => onChange({ ...block, output_template: template })}
                    className="accent-primary size-4"
                  />
                  <span className="text-sm font-medium">{t(`aiReview.templates.${template}.title`)}</span>
                </span>
                <span className="text-muted-foreground text-xs">{t(`aiReview.templates.${template}.description`)}</span>
                <span className="bg-background rounded-md border p-2" aria-hidden>
                  <TemplatePreview template={template} />
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{t("aiReview.criteria")}</legend>
        {block.criteria.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("aiReview.noCriteria")}</p>
        ) : null}
        <ol className="flex flex-col gap-2">
          {block.criteria.map((criterion, index) => (
            <li
              key={index}
              className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_2fr_6rem_auto] sm:items-start"
            >
              <div className="flex flex-col gap-1">
                <Input
                  value={criterion.name}
                  maxLength={200}
                  aria-label={t("aiReview.criterionName", { number: index + 1 })}
                  aria-invalid={criterion.name.trim() === ""}
                  aria-describedby={criterion.name.trim() === "" ? `${ids.criteria}-${index}-error` : undefined}
                  placeholder={t("aiReview.criterionNamePlaceholder")}
                  onChange={(event) => setCriterion(index, { name: event.target.value })}
                  className="h-11 md:h-8"
                />
                {criterion.name.trim() === "" ? (
                  <p id={`${ids.criteria}-${index}-error`} className="text-destructive text-xs">
                    {t("aiReview.criterionNameRequired")}
                  </p>
                ) : null}
              </div>
              <Input
                value={criterion.description}
                maxLength={1000}
                aria-label={t("aiReview.criterionDescription", { number: index + 1 })}
                placeholder={t("aiReview.criterionDescriptionPlaceholder")}
                onChange={(event) => setCriterion(index, { description: event.target.value })}
                className="h-11 md:h-8"
              />
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                value={criterion.max_score}
                aria-label={t("aiReview.criterionMax", { number: index + 1 })}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (Number.isFinite(value)) setCriterion(index, { max_score: Math.min(100, Math.max(0, value)) })
                }}
                className="h-11 md:h-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("aiReview.removeCriterion", { number: index + 1 })}
                onClick={() => onChange({ ...block, criteria: block.criteria.filter((_, at) => at !== index) })}
                className="size-11 justify-self-end md:size-8"
              >
                <Icons.trash aria-hidden />
              </Button>
            </li>
          ))}
        </ol>
        <Button
          type="button"
          variant="outline"
          disabled={block.criteria.length >= MAX_CRITERIA}
          onClick={() =>
            onChange({ ...block, criteria: [...block.criteria, { name: "", description: "", max_score: 10 }] })
          }
          className="min-h-11 self-start md:min-h-8"
        >
          <Icons.add aria-hidden />
          {t("aiReview.addCriterion")}
        </Button>
        <p className="text-muted-foreground text-xs">{t("aiReview.criteriaHint")}</p>
      </fieldset>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-2 text-sm font-semibold">{t("aiReview.sources")}</legend>
        <label htmlFor={ids.materials} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
          <Switch
            id={ids.materials}
            checked={block.use_course_materials}
            onCheckedChange={(use_course_materials) => onChange({ ...block, use_course_materials })}
          />
          {t("aiReview.courseMaterials")}
        </label>
        <label htmlFor={ids.web} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
          <Switch
            id={ids.web}
            checked={block.web_search}
            onCheckedChange={(web_search) => onChange({ ...block, web_search })}
          />
          {t("aiReview.webSearch")}
        </label>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={ids.max}>{t("aiReview.maxSubmissions")}</FieldLabel>
          <Input
            id={ids.max}
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={block.max_submissions}
            onChange={(event) => {
              const value = Math.round(Number(event.target.value))
              if (Number.isFinite(value)) onChange({ ...block, max_submissions: Math.min(20, Math.max(1, value)) })
            }}
            className="h-11 w-28 md:h-8"
          />
          <FieldDescription>{t("aiReview.maxSubmissionsHint")}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={ids.pass}>{t("aiReview.passThreshold")}</FieldLabel>
          <Input
            id={ids.pass}
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={block.pass_threshold_pct ?? 60}
            onChange={(event) => {
              const value = Math.round(Number(event.target.value))
              if (Number.isFinite(value)) onChange({ ...block, pass_threshold_pct: Math.min(100, Math.max(0, value)) })
            }}
            className="h-11 w-28 md:h-8"
          />
          <FieldDescription>{t("aiReview.passThresholdHint")}</FieldDescription>
        </Field>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-2 text-sm font-medium">{t("aiReview.acceptedTypes")}</legend>
          <div className="flex flex-wrap gap-x-4">
            {AI_REVIEW_FILE_KINDS.map((kind) => {
              const checked = block.accepted_types.includes(kind)
              return (
                <label key={kind} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                  <Checkbox
                    checked={checked}
                    disabled={checked && block.accepted_types.length === 1}
                    onCheckedChange={(on) => toggleKind(kind, on === true)}
                  />
                  {t(`aiReview.kinds.${kind}`)}
                </label>
              )
            })}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col gap-1 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={!saved}
          onClick={() => setShowSubmissions(true)}
          className="min-h-11 self-start md:min-h-8"
        >
          <Icons.students aria-hidden />
          {t("aiReview.openSubmissions")}
        </Button>
        {!saved ? <p className="text-muted-foreground text-xs">{t("aiReview.saveForSubmissions")}</p> : null}
      </div>
      {saved ? (
        <AiReviewSubmissions
          open={showSubmissions}
          onOpenChange={setShowSubmissions}
          courseId={courseId}
          stepId={stepId}
          blockId={block.id}
        />
      ) : null}
    </div>
  )
}
