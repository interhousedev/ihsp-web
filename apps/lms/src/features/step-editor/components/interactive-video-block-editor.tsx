"use client"

import { useT } from "@ihsp/i18n"
import { Button, Field, FieldLabel, Icons, Input, NativeSelect, NativeSelectOption, Switch, Textarea } from "@ihsp/ui"
import { useId, useState } from "react"
import { formatTime, parseTime, sortInteractions } from "../../player/utils/interactive-video"
import { type Interaction, type InteractiveVideoBlock, newInteraction } from "../utils/content-ops"
import { OptionListEditor } from "./option-list-editor"
import { VideoBlockEditor } from "./video-block-editor"

const KINDS: readonly Interaction["kind"][] = ["question", "note", "link"]

/**
 * An interactive video: the video source (link or upload, like a video block) and a timeline of pauses. Each pause
 * stops the player at its time and shows a multiple-choice question, a note or a link.
 */
export function InteractiveVideoBlockEditor({
  block,
  onChange,
  keyOf = (id) => id,
  courseId,
  stepId,
}: {
  block: InteractiveVideoBlock
  onChange: (block: InteractiveVideoBlock) => void
  keyOf?: (id: string) => string
  courseId?: string
  stepId?: string
}) {
  const t = useT("stepEditor")
  const atId = useId()
  const [at, setAt] = useState("0:00")
  const atSeconds = parseTime(at)
  const sorted = sortInteractions(block.interactions)

  function add(kind: Interaction["kind"]) {
    if (atSeconds === null) return
    onChange({ ...block, interactions: [...block.interactions, newInteraction(kind, atSeconds)] })
  }

  function update(id: string, next: Interaction) {
    onChange({ ...block, interactions: block.interactions.map((item) => (item.id === id ? next : item)) })
  }

  return (
    <div className="flex flex-col gap-4">
      <VideoBlockEditor block={block} onChange={onChange} courseId={courseId} stepId={stepId} />
      <section aria-labelledby={`${atId}-title`} className="flex flex-col gap-3">
        <h4 id={`${atId}-title`} className="text-sm font-semibold">
          {t("interactive.timeline")}
        </h4>
        {sorted.length > 0 ? <Timeline items={sorted} /> : null}
        <div className="flex flex-wrap items-end gap-2">
          <Field className="w-28">
            <FieldLabel htmlFor={atId}>{t("interactive.at")}</FieldLabel>
            <Input
              id={atId}
              value={at}
              onChange={(event) => setAt(event.target.value)}
              inputMode="numeric"
              placeholder="1:30"
              aria-invalid={atSeconds === null}
              className="h-11 md:h-8"
            />
          </Field>
          {KINDS.map((kind) => (
            <Button
              key={kind}
              type="button"
              variant="outline"
              disabled={atSeconds === null}
              onClick={() => add(kind)}
              className="min-h-11 md:min-h-8"
            >
              <Icons.add aria-hidden />
              {t(`interactive.add.${kind}`)}
            </Button>
          ))}
        </div>
        {sorted.length === 0 ? <p className="text-muted-foreground text-sm">{t("interactive.none")}</p> : null}
        <ol className="flex flex-col gap-3">
          {sorted.map((item) => (
            <li key={keyOf(item.id)}>
              <InteractionEditor
                item={item}
                keyOf={keyOf}
                onChange={(next) => update(item.id, next)}
                onRemove={() =>
                  onChange({ ...block, interactions: block.interactions.filter((other) => other.id !== item.id) })
                }
              />
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

/** A bar with a mark per pause, spread over the time up to the last one. */
function Timeline({ items }: { items: Interaction[] }) {
  const t = useT("stepEditor")
  const end = Math.max(...items.map((item) => item.at_sec), 1) * 1.05
  return (
    <div className="bg-muted relative h-3 w-full rounded-full" role="img" aria-label={t("interactive.timeline")}>
      {items.map((item) => (
        <span
          key={item.id}
          className="bg-primary absolute top-0 size-3 -translate-x-1/2 rounded-full"
          style={{ left: `${(item.at_sec / end) * 100}%` }}
          title={`${formatTime(item.at_sec)} · ${t(`interactive.kinds.${item.kind}`)}`}
        />
      ))}
    </div>
  )
}

function InteractionEditor({
  item,
  keyOf,
  onChange,
  onRemove,
}: {
  item: Interaction
  keyOf: (id: string) => string
  onChange: (item: Interaction) => void
  onRemove: () => void
}) {
  const t = useT("stepEditor")
  const id = useId()
  const [time, setTime] = useState(formatTime(item.at_sec))
  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-3" data-interaction={item.id}>
      <legend className="sr-only">
        {formatTime(item.at_sec)} · {t(`interactive.kinds.${item.kind}`)}
      </legend>
      <div className="flex flex-wrap items-end gap-2">
        <Field className="w-24">
          <FieldLabel htmlFor={`${id}-at`}>{t("interactive.at")}</FieldLabel>
          <Input
            id={`${id}-at`}
            value={time}
            inputMode="numeric"
            onChange={(event) => setTime(event.target.value)}
            onBlur={() => {
              const seconds = parseTime(time)
              if (seconds === null) setTime(formatTime(item.at_sec))
              else onChange({ ...item, at_sec: seconds })
            }}
            className="h-11 md:h-8"
          />
        </Field>
        <Field className="w-36">
          <FieldLabel htmlFor={`${id}-kind`}>{t("interactive.kind")}</FieldLabel>
          <NativeSelect
            id={`${id}-kind`}
            value={item.kind}
            onChange={(event) => {
              const kind = event.target.value as Interaction["kind"]
              const fresh = newInteraction(kind, item.at_sec)
              onChange({ ...item, kind, options: kind === "question" ? fresh.options : [] })
            }}
            className="w-full"
          >
            {KINDS.map((kind) => (
              <NativeSelectOption key={kind} value={kind}>
                {t(`interactive.kinds.${kind}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={t("interactive.remove", { time: formatTime(item.at_sec) })}
          className="ms-auto size-11 md:size-8"
        >
          <Icons.trash aria-hidden />
        </Button>
      </div>
      <Field>
        <FieldLabel htmlFor={`${id}-text`}>
          {item.kind === "question" ? t("interactive.question") : t("interactive.text")}
        </FieldLabel>
        <Textarea
          id={`${id}-text`}
          value={item.text}
          rows={2}
          onChange={(event) => onChange({ ...item, text: event.target.value })}
        />
      </Field>
      {item.kind === "link" ? (
        <Field>
          <FieldLabel htmlFor={`${id}-url`}>{t("interactive.url")}</FieldLabel>
          <Input
            id={`${id}-url`}
            type="url"
            inputMode="url"
            value={item.url}
            placeholder="https://"
            onChange={(event) => onChange({ ...item, url: event.target.value })}
            className="h-11 md:h-8"
          />
        </Field>
      ) : null}
      {item.kind === "question" ? (
        <>
          <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
            <Switch
              checked={item.multiple}
              onCheckedChange={(multiple) => onChange({ ...item, multiple })}
              aria-label={t("interactive.multiple")}
            />
            {t("interactive.multiple")}
          </label>
          <OptionListEditor
            questionId={item.id}
            type={item.multiple ? "multiple" : "single"}
            options={item.options}
            keyOf={keyOf}
            onChange={(options) => onChange({ ...item, options })}
          />
        </>
      ) : null}
    </fieldset>
  )
}
