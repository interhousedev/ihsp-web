"use client"

import {
  getLmsPreviewStepVideoQuery,
  getLmsStepVideoQuery,
  postLmsInteractionAnswer,
  type InteractionAnswer,
  type LearningInteraction,
  type LearningInteractiveVideoBlock,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Icons } from "@ihsp/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState } from "react"
import { dueInteraction, embedUrl, formatTime, sortInteractions, videoSource } from "../utils/interactive-video"
import { nativeController, vimeoController, youtubeController, type VideoController } from "../utils/video-controller"

/**
 * An interactive video: the player stops at each pause the author placed (a question, a note or a link), shows it
 * under the video and goes on when the student continues. The first answer to a question is graded by the server
 * and counts; a preview grades nothing.
 */
export function InteractiveVideoBlock({
  block,
  courseId,
  stepId,
  preview,
}: {
  block: LearningInteractiveVideoBlock
  courseId: string
  stepId: string
  preview: boolean
}) {
  const t = useT("player")
  const sorted = useMemo(() => sortInteractions(block.interactions), [block.interactions])
  const [answers, setAnswers] = useState<Record<string, InteractionAnswer>>(block.answers ?? {})
  const [seen, setSeen] = useState<Set<string>>(() => new Set(Object.keys(block.answers ?? {})))
  const [active, setActive] = useState<LearningInteraction | null>(null)
  const controller = useRef<VideoController | null>(null)
  const last = useRef(0)
  const activeRef = useRef<LearningInteraction | null>(null)
  const seenRef = useRef(seen)
  seenRef.current = seen

  function onTime(seconds: number) {
    const previous = last.current
    last.current = seconds
    if (activeRef.current) return
    const due = dueInteraction(sorted, previous, seconds, seenRef.current)
    if (due) {
      controller.current?.pause()
      activeRef.current = due
      setActive(due)
    }
  }

  function close() {
    const current = activeRef.current
    if (current) {
      setSeen((done) => new Set(done).add(current.id))
      seenRef.current = new Set(seenRef.current).add(current.id)
      // pauses crossed by the same jump come next: scan again from this one
      last.current = Math.min(last.current, current.at_sec)
    }
    activeRef.current = null
    setActive(null)
    controller.current?.play()
  }

  return (
    <figure className="flex flex-col gap-3" data-interactive-video={block.id}>
      <Player
        block={block}
        courseId={courseId}
        stepId={stepId}
        preview={preview}
        controller={controller}
        onTime={onTime}
      />
      {block.caption ? <figcaption className="text-muted-foreground text-sm">{block.caption}</figcaption> : null}
      {active ? (
        <InteractionPanel
          key={active.id}
          item={active}
          answer={answers[active.id]}
          stepId={stepId}
          blockId={block.id}
          preview={preview}
          onAnswered={(answer) => setAnswers((all) => ({ ...all, [active.id]: answer }))}
          onContinue={close}
        />
      ) : null}
      {sorted.length > 0 ? (
        <ol aria-label={t("interactive.markers")} className="flex flex-wrap gap-2">
          {sorted.map((item) => {
            const answer = answers[item.id]
            return (
              <li
                key={item.id}
                className="bg-muted flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                data-marker={item.id}
              >
                {answer ? (
                  answer.correct ? (
                    <Icons.check aria-hidden className="size-3.5 text-green-600" />
                  ) : (
                    <Icons.close aria-hidden className="text-destructive size-3.5" />
                  )
                ) : null}
                <span>
                  {formatTime(item.at_sec)} · {t(`interactive.kinds.${item.kind}`)}
                </span>
              </li>
            )
          })}
        </ol>
      ) : null}
    </figure>
  )
}

function Player({
  block,
  courseId,
  stepId,
  preview,
  controller,
  onTime,
}: {
  block: LearningInteractiveVideoBlock
  courseId: string
  stepId: string
  preview: boolean
  controller: React.MutableRefObject<VideoController | null>
  onTime: (seconds: number) => void
}) {
  const t = useT("player")
  const listener = useRef(onTime)
  listener.current = onTime
  const upload = block.source === "upload" && block.file_id !== null
  const stream = useQuery({
    ...(preview
      ? getLmsPreviewStepVideoQuery(courseId, stepId, block.id)
      : getLmsStepVideoQuery(courseId, stepId, block.id)),
    enabled: upload,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const source = upload ? null : videoSource(block.url)
  const label = block.caption || t("video")
  const video = useRef<HTMLVideoElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const src = upload ? (stream.data?.url ?? null) : source?.kind === "file" ? source.src : null

  useEffect(() => {
    const report = (seconds: number) => listener.current(seconds)
    let made: VideoController | null = null
    if (video.current) made = nativeController(video.current, report)
    else if (frame.current && source?.kind === "youtube") made = youtubeController(frame.current, report)
    else if (frame.current && source?.kind === "vimeo") made = vimeoController(frame.current, report)
    controller.current = made
    return () => {
      made?.destroy()
      controller.current = null
    }
  }, [controller, source?.kind, src])

  if (upload && stream.isPending)
    return <div className="bg-muted aspect-video w-full animate-pulse rounded-lg" aria-hidden />
  if (src) {
    return (
      <video
        ref={video}
        src={src}
        controls
        playsInline
        preload="metadata"
        aria-label={label}
        className="aspect-video w-full rounded-lg border bg-black"
      >
        <track kind="captions" />
      </video>
    )
  }
  if (source && (source.kind === "youtube" || source.kind === "vimeo")) {
    return (
      <iframe
        ref={frame}
        id={`iv-${block.id}`}
        src={embedUrl(source, typeof window === "undefined" ? "" : window.location.origin)}
        title={label}
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        referrerPolicy="strict-origin-when-cross-origin"
        className="aspect-video w-full rounded-lg border"
      />
    )
  }
  return <p className="text-muted-foreground text-sm">{t("videoUnavailable")}</p>
}

function InteractionPanel({
  item,
  answer,
  stepId,
  blockId,
  preview,
  onAnswered,
  onContinue,
}: {
  item: LearningInteraction
  answer: InteractionAnswer | undefined
  stepId: string
  blockId: string
  preview: boolean
  onAnswered: (answer: InteractionAnswer) => void
  onContinue: () => void
}) {
  const t = useT("player")
  const errorMessage = useErrorMessage()
  const [chosen, setChosen] = useState<string[]>(answer?.option_ids ?? [])
  const [correctIds, setCorrectIds] = useState<string[] | null>(null)
  const submit = useMutation({
    mutationFn: () => postLmsInteractionAnswer(stepId, blockId, item.id, chosen),
    onSuccess: (result) => {
      setCorrectIds(result.correct_option_ids)
      onAnswered(result.answer)
    },
  })
  const continueButton = useRef<HTMLButtonElement>(null)
  const done = answer !== undefined || item.kind !== "question"

  useEffect(() => {
    if (done) continueButton.current?.focus()
  }, [done])

  function toggle(id: string) {
    setChosen((current) =>
      item.multiple ? (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]) : [id],
    )
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-label={t(`interactive.kinds.${item.kind}`)}
      className="bg-card flex flex-col gap-3 rounded-lg border p-4"
    >
      <p className="text-muted-foreground text-xs">
        {formatTime(item.at_sec)} · {t(`interactive.kinds.${item.kind}`)}
      </p>
      {item.text ? <p className="text-base break-words whitespace-pre-line">{item.text}</p> : null}
      {item.kind === "link" && item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary w-fit break-all underline underline-offset-2"
        >
          {item.url}
        </a>
      ) : null}
      {item.kind === "question" ? (
        <fieldset className="flex flex-col gap-2" disabled={answer !== undefined || submit.isPending}>
          <legend className="sr-only">{item.text}</legend>
          {item.options.map((option) => {
            const right = correctIds?.includes(option.id)
            return (
              <label
                key={option.id}
                className="has-[:checked]:border-primary flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-2"
                data-correct={right === undefined ? undefined : String(right)}
              >
                <input
                  type={item.multiple ? "checkbox" : "radio"}
                  name={`interaction-${item.id}`}
                  checked={chosen.includes(option.id)}
                  onChange={() => toggle(option.id)}
                  className="size-4"
                />
                <span className="break-words">{option.text}</span>
                {right ? (
                  <Icons.check aria-label={t("interactive.rightOption")} className="ms-auto size-4 text-green-600" />
                ) : null}
              </label>
            )
          })}
        </fieldset>
      ) : null}
      {answer ? (
        <p role="status" className={answer.correct ? "text-sm text-green-700" : "text-destructive text-sm"}>
          {answer.correct ? t("interactive.correct") : t("interactive.wrong")}
        </p>
      ) : null}
      {submit.error ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(submit.error)}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {item.kind === "question" && answer === undefined && !preview ? (
          <Button
            type="button"
            disabled={chosen.length === 0 || submit.isPending}
            onClick={() => submit.mutate()}
            className="min-h-11 md:min-h-8"
          >
            {t("interactive.answer")}
          </Button>
        ) : null}
        <Button
          ref={continueButton}
          type="button"
          variant={done || preview ? "default" : "outline"}
          onClick={onContinue}
          className="min-h-11 md:min-h-8"
        >
          <Icons.chevronRight aria-hidden />
          {done || preview ? t("interactive.continue") : t("interactive.skip")}
        </Button>
      </div>
    </section>
  )
}
