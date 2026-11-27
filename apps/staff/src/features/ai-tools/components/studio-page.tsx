"use client"

import { BackLink } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, IconLoader, IconMicrophone, IconVideo, PageContainer, Pill, Textarea } from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"
import type { MediaKind } from "../api"
import { useMediaJob } from "../hooks/use-ai-tools"
import { DownloadMediaButton } from "./download-media-button"
import { FieldRow, NativeSelect, SubjectGroupFields, useDefaultSubject, useNotebookName } from "./form-bits"
import { NotebookHint, NotebookSaved } from "./saved-to"

const TONE = { queued: "neutral", voicing: "primary", rendering: "primary", done: "success", failed: "danger" } as const

/**
 * `/ai-tools/studio/`: one module for a voiced video and a voice-over. The teacher writes the script, one scene per
 * paragraph; the server voices it, renders the .mp4 and stores the scenes with their timecodes in the subject notebook,
 * so the assistant can point to a moment of the video.
 */
export function StudioPage() {
  const t = useT("aiTools")
  const [outputParam] = useQueryState("output", parseAsString)
  const [kind, setKind] = useState<MediaKind>(outputParam === "audio" ? "audio_only" : "video_with_voice")
  const defaultSubject = useDefaultSubject()
  const [subjectChoice, setSubjectChoice] = useState("")
  const subjectId = subjectChoice || defaultSubject
  const [groupId, setGroupId] = useState("")
  const [language, setLanguage] = useState("ru")
  const [text, setText] = useState("")
  const { job, starting, error, start, reset } = useMediaJob()
  const destination = useNotebookName(subjectId, groupId)
  const scenes = text
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean)
  const isVideo = kind === "video_with_voice"
  const busy = job !== null && job.status !== "done" && job.status !== "failed"
  return (
    <PageContainer title={t("studio.title")} className="pb-28 md:pb-6">
      <BackLink href="/ai-tools/" label={t("title")} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        {job ? (
          <section aria-live="polite" className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-card p-5 ring-1">
            <Pill tone={TONE[job.status]} className="self-start">
              {busy ? <IconLoader className="size-3.5 animate-spin" aria-hidden /> : null}
              {t(`studio.state.${job.status}`)}
            </Pill>
            {job.status === "done" && job.file_id ? (
              <>
                <DownloadMediaButton fileId={job.file_id} video={isVideo} />
                <NotebookSaved destination={destination} />
              </>
            ) : null}
            {job.status === "failed" ? <p className="text-sm">{t("studio.failedKept")}</p> : null}
            {!busy ? (
              <Button type="button" variant="outline" className="self-start" onClick={reset}>
                {t("studio.another")}
              </Button>
            ) : null}
          </section>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              start({
                subject_id: subjectId,
                group_id: groupId || null,
                kind,
                language,
                script: scenes.map((s, i) => ({ id: `s${i + 1}`, speaker: "host", text: s })),
              })
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["video_with_voice", IconVideo, t("studio.outputs.video")],
                  ["audio_only", IconMicrophone, t("studio.outputs.audio")],
                ] as const
              ).map(([id, Icon, label]) => (
                <Button key={id} type="button" variant={kind === id ? "default" : "outline"} aria-pressed={kind === id} onClick={() => setKind(id)}>
                  <Icon aria-hidden />
                  {label}
                </Button>
              ))}
            </div>
            <label htmlFor="st-script" className="sr-only">
              {t("studio.scriptLabel")}
            </label>
            <Textarea
              id="st-script"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("studio.scriptPlaceholder")}
              className="min-h-72 max-h-[70vh] p-4 text-base leading-relaxed md:text-base"
            />
            <p className="text-muted-foreground text-sm">{t("studio.scenesCount", { count: scenes.length })}</p>
            <SubjectGroupFields subjectId={subjectId} groupId={groupId} onSubject={setSubjectChoice} onGroup={setGroupId} idPrefix="st" />
            <FieldRow label={t("form.language")} htmlFor="st-lang">
              <NativeSelect id="st-lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="ru">Русский</option>
                <option value="uz">Oʼzbekcha</option>
                <option value="en">English</option>
              </NativeSelect>
            </FieldRow>
            <NotebookHint destination={destination} />
            {error ? <p className="text-destructive text-sm">{t("studio.failed")}</p> : null}
            <Button type="submit" size="lg" className="self-start" disabled={starting || scenes.length === 0 || subjectId === ""}>
              {starting ? <IconLoader className="animate-spin" aria-hidden /> : null}
              {t("studio.start")}
            </Button>
          </form>
        )}
      </div>
    </PageContainer>
  )
}
