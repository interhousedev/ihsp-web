"use client"

import { postLmsVideoChecksSuggest, type TutorLanguage, type VideoChecks } from "@ihsp/api"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  Field,
  FieldLabel,
  Icons,
  Input,
  LoadingButton,
  ResponsiveDialog,
  Textarea,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { type ChangeEvent, useId, useRef, useState } from "react"
import { formatTime, parseTime } from "../../player/utils/interactive-video"
import type { FlashcardsBlock, Interaction } from "../utils/content-ops"
import { isSubtitles, prepareTranscript } from "../utils/transcript"
import {
  type CardDraft,
  type CheckDraft,
  cardDrafts,
  cardsToBlock,
  checkDrafts,
  checkReady,
  checkToInteraction,
} from "../utils/video-checks"

const SUBTITLE_ACCEPT = ".vtt,.srt,text/vtt,application/x-subrip,text/plain"
const TRANSCRIPT_MAX = 60_000

/**
 * Suggests pause-and-predict checks from a transcript (pasted, or a `.vtt`/`.srt` file). The author edits each
 * proposed pause, accepts it into the video timeline one by one, and may add the recap cards as a flash cards block.
 */
export function VideoChecksDialog({
  open,
  onOpenChange,
  courseId,
  stepId,
  blockId,
  title,
  onAcceptCheck,
  onAddCards,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  stepId: string
  blockId: string
  title: string
  onAcceptCheck: (interaction: Interaction) => void
  onAddCards?: (block: FlashcardsBlock) => void
}) {
  const t = useT("stepEditor")
  const errorMessage = useErrorMessage()
  const locale = useLocale() as TutorLanguage
  const transcriptId = useId()
  const file = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [length, setLength] = useState("")
  const [checks, setChecks] = useState<CheckDraft[] | null>(null)
  const [cards, setCards] = useState<CardDraft[]>([])
  const [accepted, setAccepted] = useState(0)
  const [cardsAdded, setCardsAdded] = useState(false)

  const suggest = useMutation<VideoChecks, unknown, void>({
    mutationFn: () => {
      const { transcript, durationSeconds } = prepareTranscript(source)
      return postLmsVideoChecksSuggest(courseId, stepId, blockId, {
        transcript,
        duration_seconds: durationSeconds ?? parseTime(length),
        language: locale,
        title,
      })
    },
    onSuccess: (result) => {
      setChecks(checkDrafts(result.checks))
      setCards(cardDrafts(result.cards))
      setAccepted(0)
      setCardsAdded(false)
    },
  })

  function reset() {
    setChecks(null)
    setCards([])
    suggest.reset()
  }

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    event.target.value = ""
    if (!picked) return
    setSource(await picked.text())
    setFileName(picked.name)
  }

  const trimmed = source.trim()
  const tooLong = trimmed.length > TRANSCRIPT_MAX
  const keptCards = cards.filter((card) => card.keep).length

  const footer =
    checks === null ? (
      <>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="min-h-11 md:min-h-8">
          {t("videoChecks.cancel")}
        </Button>
        <LoadingButton
          type="button"
          loading={suggest.isPending}
          disabled={trimmed === "" || tooLong}
          onClick={() => suggest.mutate()}
          className="min-h-11 md:min-h-8"
        >
          <Icons.sparkles aria-hidden />
          {t("videoChecks.suggest")}
        </LoadingButton>
      </>
    ) : (
      <>
        <Button type="button" variant="outline" onClick={reset} className="min-h-11 md:min-h-8">
          {t("videoChecks.again")}
        </Button>
        <Button type="button" onClick={() => onOpenChange(false)} className="min-h-11 md:min-h-8">
          {t("videoChecks.done")}
        </Button>
      </>
    )

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={t("videoChecks.title")}
      description={t("videoChecks.description")}
      footer={footer}
      disablePointerDismissal
    >
      {checks === null ? (
        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor={transcriptId}>{t("videoChecks.transcript")}</FieldLabel>
            <Textarea
              id={transcriptId}
              value={source}
              rows={8}
              placeholder={t("videoChecks.transcriptPlaceholder")}
              aria-invalid={tooLong}
              onChange={(event) => {
                setSource(event.target.value)
                setFileName(null)
              }}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => file.current?.click()}
              className="min-h-11 md:min-h-8"
            >
              <Icons.upload aria-hidden />
              {t("videoChecks.upload")}
            </Button>
            {fileName ? (
              <span className="text-muted-foreground truncate text-sm">
                {t("videoChecks.loaded", { name: fileName })}
              </span>
            ) : null}
            <input
              ref={file}
              type="file"
              accept={SUBTITLE_ACCEPT}
              hidden
              tabIndex={-1}
              aria-label={t("videoChecks.upload")}
              onChange={(event) => void onPick(event)}
            />
          </div>
          {trimmed !== "" && !isSubtitles(source) ? (
            <Field className="w-40">
              <FieldLabel htmlFor={`${transcriptId}-length`}>{t("videoChecks.length")}</FieldLabel>
              <Input
                id={`${transcriptId}-length`}
                value={length}
                inputMode="numeric"
                placeholder="12:30"
                aria-invalid={length !== "" && parseTime(length) === null}
                onChange={(event) => setLength(event.target.value)}
                className="h-11 md:h-8"
              />
            </Field>
          ) : null}
          {tooLong ? <p className="text-destructive text-sm">{t("videoChecks.tooLong")}</p> : null}
          {suggest.isPending ? (
            <p className="text-muted-foreground text-sm" role="status">
              {t("videoChecks.thinking")}
            </p>
          ) : null}
          {suggest.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(suggest.error)}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3" aria-labelledby={`${transcriptId}-checks`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 id={`${transcriptId}-checks`} className="text-sm font-semibold">
                {t("videoChecks.checks")}
              </h3>
              {accepted > 0 ? (
                <span className="text-muted-foreground text-sm" role="status">
                  {t("videoChecks.acceptedCount", { count: accepted })}
                </span>
              ) : null}
            </div>
            {checks.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("videoChecks.noChecks")}</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {checks.map((check) => (
                  <li key={check.key}>
                    <CheckEditor
                      check={check}
                      onChange={(next) => setChecks((all) => all?.map((c) => (c.key === check.key ? next : c)) ?? all)}
                      onDiscard={() => setChecks((all) => all?.filter((c) => c.key !== check.key) ?? all)}
                      onAccept={() => {
                        onAcceptCheck(checkToInteraction(check))
                        setAccepted((count) => count + 1)
                        setChecks((all) => all?.filter((c) => c.key !== check.key) ?? all)
                      }}
                    />
                  </li>
                ))}
              </ol>
            )}
          </section>

          {cards.length > 0 && onAddCards ? (
            <section className="flex flex-col gap-3" aria-labelledby={`${transcriptId}-cards`}>
              <div>
                <h3 id={`${transcriptId}-cards`} className="text-sm font-semibold">
                  {t("videoChecks.cards")}
                </h3>
                <p className="text-muted-foreground text-sm">{t("videoChecks.cardsHint")}</p>
              </div>
              {cardsAdded ? (
                <p className="text-sm" role="status">
                  {t("videoChecks.cardsAdded")}
                </p>
              ) : (
                <>
                  <ul className="flex flex-col gap-2">
                    {cards.map((card, index) => (
                      <li key={card.key}>
                        <CardEditor
                          card={card}
                          number={index + 1}
                          onChange={(next) => setCards((all) => all.map((c) => (c.key === card.key ? next : c)))}
                        />
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={keptCards === 0}
                    onClick={() => {
                      const block = cardsToBlock(cards)
                      if (!block) return
                      onAddCards(block)
                      setCardsAdded(true)
                    }}
                    className="min-h-11 self-start md:min-h-8"
                  >
                    <Icons.add aria-hidden />
                    {t("videoChecks.addCards", { count: keptCards })}
                  </Button>
                </>
              )}
            </section>
          ) : null}
        </div>
      )}
    </ResponsiveDialog>
  )
}

function CheckEditor({
  check,
  onChange,
  onAccept,
  onDiscard,
}: {
  check: CheckDraft
  onChange: (check: CheckDraft) => void
  onAccept: () => void
  onDiscard: () => void
}) {
  const t = useT("stepEditor")
  const id = useId()
  const [time, setTime] = useState(formatTime(check.at_seconds))
  const timeValid = parseTime(time) !== null
  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
      <legend className="sr-only">{t("videoChecks.checkAt", { time: formatTime(check.at_seconds) })}</legend>
      <div className="flex items-end gap-2">
        <Field className="w-24">
          <FieldLabel htmlFor={`${id}-at`}>{t("interactive.at")}</FieldLabel>
          <Input
            id={`${id}-at`}
            value={time}
            inputMode="numeric"
            aria-invalid={!timeValid}
            onChange={(event) => setTime(event.target.value)}
            onBlur={() => {
              const seconds = parseTime(time)
              if (seconds === null) setTime(formatTime(check.at_seconds))
              else onChange({ ...check, at_seconds: seconds })
            }}
            className="h-11 md:h-8"
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor={`${id}-q`}>{t("interactive.question")}</FieldLabel>
        <Textarea
          id={`${id}-q`}
          value={check.question}
          rows={2}
          onChange={(event) => onChange({ ...check, question: event.target.value })}
        />
      </Field>
      <div role="radiogroup" aria-label={t("videoChecks.options")} className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("videoChecks.options")}</span>
        {check.options.map((option, index) => (
          // eslint-disable-next-line react/no-array-index-key -- options have no ids until accepted
          <div key={index} className="flex items-center gap-2">
            <input
              type="radio"
              name={`${id}-correct`}
              checked={check.correct_index === index}
              onChange={() => onChange({ ...check, correct_index: index })}
              aria-label={t("videoChecks.correct", { number: index + 1 })}
              className="accent-primary size-5 shrink-0"
            />
            <Input
              value={option}
              aria-label={t("videoChecks.option", { number: index + 1 })}
              onChange={(event) =>
                onChange({
                  ...check,
                  options: check.options.map((text, i) => (i === index ? event.target.value : text)),
                })
              }
              className="h-11 md:h-8"
            />
          </div>
        ))}
      </div>
      {check.explanation ? (
        <p className="text-muted-foreground text-sm">
          <span className="font-medium">{t("videoChecks.why")}</span> {check.explanation}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDiscard} className="min-h-11 md:min-h-8">
          {t("videoChecks.discard")}
        </Button>
        <Button
          type="button"
          disabled={!checkReady(check) || !timeValid}
          onClick={onAccept}
          className="min-h-11 md:min-h-8"
        >
          <Icons.check aria-hidden />
          {t("videoChecks.accept", { time: formatTime(check.at_seconds) })}
        </Button>
      </div>
    </fieldset>
  )
}

function CardEditor({
  card,
  number,
  onChange,
}: {
  card: CardDraft
  number: number
  onChange: (card: CardDraft) => void
}) {
  const t = useT("stepEditor")
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Checkbox
        checked={card.keep}
        onCheckedChange={(keep) => onChange({ ...card, keep: keep === true })}
        aria-label={t("videoChecks.keepCard", { number })}
        className="mt-3 md:mt-2"
      />
      <div className="grid flex-1 gap-2 sm:grid-cols-2">
        <Input
          value={card.front}
          disabled={!card.keep}
          aria-label={t("videoChecks.front", { number })}
          onChange={(event) => onChange({ ...card, front: event.target.value })}
          className="h-11 md:h-8"
        />
        <Input
          value={card.back}
          disabled={!card.keep}
          aria-label={t("videoChecks.back", { number })}
          onChange={(event) => onChange({ ...card, back: event.target.value })}
          className="h-11 md:h-8"
        />
      </div>
    </div>
  )
}
