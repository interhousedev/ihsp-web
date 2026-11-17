"use client"

import { ApiError } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Icons,
  Input,
  Label,
  PageHeader,
  StateView,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { CommentsPanel } from "../../comments/components/comments-panel"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useEssay, useRestore, useSaveEssay, type Essay, type EssayLink, type PlanSection } from "../api"
import { countWords } from "../diff"
import { CoachPanel } from "./coach-panel"
import { IdeasBoard } from "./ideas-board"
import { PlanPane } from "./plan-pane"
import { VersionsPanel } from "./versions-panel"

/** Quiet time after the last keystroke before the draft is saved. */
export const AUTOSAVE_MS = 1500

type Draft = {
  title: string
  prompt_text: string
  word_limit: number | null
  body: string
  notes: string
  plan: PlanSection[]
  links: EssayLink[]
}
type SaveState = "saved" | "dirty" | "saving" | "conflict" | "error"

const draftOf = (e: Essay): Draft => ({
  title: e.title,
  prompt_text: e.prompt_text,
  word_limit: e.word_limit,
  body: e.body,
  notes: e.notes,
  plan: e.plan,
  links: e.links,
})

/**
 * The draft autosaves with the server's `lock_version`; a 409 means the essay changed elsewhere (another tab
 * or a restore), and the writer reloads instead of overwriting it. Unsaved text stays visible to copy.
 */
export function EssayEditor({ essay }: { essay: Essay }) {
  const t = useT("essays")
  const errorMessage = useErrorMessage()
  const { session } = useSession()
  const save = useSaveEssay(essay.id)
  const restore = useRestore(essay.id)
  const current = useEssay(essay.id)
  const [draft, setDraft] = useState<Draft>(() => draftOf(essay))
  const [state, setState] = useState<SaveState>("saved")
  const [lost, setLost] = useState<string | null>(null)
  const server = useRef(essay)
  const latest = useRef(draft)
  const dirty = useRef(false)
  const inFlight = useRef<Promise<number> | null>(null)

  /** Saves the current draft when it has changes; resolves to the lock version to use next. */
  const flush = useCallback(async (): Promise<number> => {
    if (inFlight.current) await inFlight.current.catch(() => undefined)
    if (!dirty.current) return server.current.lock_version
    const sent = latest.current
    dirty.current = false
    setState("saving")
    const run = save
      .mutateAsync({
        lock_version: server.current.lock_version,
        ...sent,
        plan: sent.plan.filter((s) => s.heading.trim()),
      })
      .then((saved) => {
        server.current = saved
        if (latest.current === sent) setState("saved")
        else dirty.current = true
        return saved.lock_version
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 409) {
          setState("conflict")
          setLost(sent.body)
        } else {
          dirty.current = true
          setState("error")
        }
        throw error
      })
      .finally(() => {
        inFlight.current = null
      })
    inFlight.current = run
    return run
  }, [save])

  useEffect(() => {
    if (state !== "dirty") return
    const timer = setTimeout(() => void flush().catch(() => undefined), AUTOSAVE_MS)
    return () => clearTimeout(timer)
  }, [draft, state, flush])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current || inFlight.current) event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [])

  const update = (patch: Partial<Draft>) => {
    if (state === "conflict") return
    dirty.current = true
    latest.current = { ...latest.current, ...patch }
    setDraft(latest.current)
    setState("dirty")
  }
  const reset = (e: Essay) => {
    server.current = e
    dirty.current = false
    latest.current = draftOf(e)
    setDraft(latest.current)
    setState("saved")
  }
  const reload = async () => {
    const fresh = await current.refetch()
    if (fresh.data) reset(fresh.data)
  }
  const onRestore = async (version: number) => {
    try {
      const lock = await flush()
      reset(await restore.mutateAsync({ version, lock_version: lock }))
    } catch {
      /* the state line shows the conflict or error */
    }
  }

  const words = countWords(draft.body)
  const over = draft.word_limit !== null && words > draft.word_limit
  const status =
    state === "saving"
      ? t("save.saving")
      : state === "dirty"
        ? t("save.dirty")
        : state === "error"
          ? t("save.error")
          : state === "conflict"
            ? t("save.conflict")
            : t("save.saved")

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        back={
          <Link href="/essays/" aria-label={t("back")} className="text-muted-foreground hover:text-foreground">
            <Icons.chevronLeft aria-hidden />
          </Link>
        }
        title={draft.title || t("untitled")}
        meta={t(`kind.${essay.kind}`)}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="essay-title-edit">{t("titleLabel")}</Label>
            <Input
              id="essay-title-edit"
              value={draft.title}
              maxLength={120}
              onChange={(e) => update({ title: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="essay-limit-edit">{t("wordLimit")}</Label>
            <Input
              id="essay-limit-edit"
              type="number"
              min={1}
              inputMode="numeric"
              className="w-32"
              value={draft.word_limit ?? ""}
              onChange={(e) =>
                update({ word_limit: e.target.value === "" ? null : Math.floor(Number(e.target.value)) })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="essay-prompt-edit">{t("promptLabel")}</Label>
            <Textarea
              id="essay-prompt-edit"
              rows={2}
              value={draft.prompt_text}
              onChange={(e) => update({ prompt_text: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="essay-body">{t("body")}</Label>
            <Textarea
              id="essay-body"
              className="min-h-[24rem] text-base leading-relaxed"
              value={draft.body}
              readOnly={state === "conflict"}
              aria-describedby="essay-count essay-save"
              onChange={(e) => update({ body: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span id="essay-count" className={over ? "text-destructive font-medium" : "text-muted-foreground"}>
              {draft.word_limit
                ? t("wordsOf", { count: words, limit: draft.word_limit })
                : t("words", { count: words })}
              {over ? ` · ${t("overLimit", { count: words - (draft.word_limit ?? 0) })}` : ""}
            </span>
            <span
              id="essay-save"
              role="status"
              aria-live="polite"
              className="text-muted-foreground flex items-center gap-2"
            >
              {status}
              {state === "error" ? (
                <Button type="button" size="sm" variant="ghost" onClick={() => void flush().catch(() => undefined)}>
                  {t("save.retry")}
                </Button>
              ) : null}
            </span>
          </div>
          {state === "conflict" ? (
            <Alert variant="destructive">
              <AlertDescription className="flex flex-col gap-2">
                {t("save.conflictText")}
                <Button type="button" size="sm" className="self-start" onClick={() => void reload()}>
                  {t("save.reload")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          {lost && state !== "conflict" ? (
            <details className="border-hairline rounded-card border p-3 text-sm">
              <summary className="cursor-pointer">{t("save.lost")}</summary>
              <p className="mt-2 whitespace-pre-wrap select-all">{lost}</p>
              <Button type="button" size="sm" variant="ghost" onClick={() => setLost(null)}>
                {t("save.dismiss")}
              </Button>
            </details>
          ) : null}
          {restore.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(restore.error)}
            </p>
          ) : null}
        </div>
        <Tabs defaultValue="plan" className="flex flex-col gap-3">
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="plan">{t("tabs.plan")}</TabsTrigger>
            <TabsTrigger value="coach">{t("tabs.coach")}</TabsTrigger>
            <TabsTrigger value="versions">{t("tabs.versions")}</TabsTrigger>
            <TabsTrigger value="ideas">{t("tabs.ideas")}</TabsTrigger>
            <TabsTrigger value="comments">{t("tabs.comments")}</TabsTrigger>
          </TabsList>
          <TabsContent value="plan">
            <PlanPane plan={draft.plan} notes={draft.notes} links={draft.links} onChange={update} />
          </TabsContent>
          <TabsContent value="coach">
            <CoachPanel essayId={essay.id} beforeRun={flush} onUseOutline={(plan) => update({ plan })} />
          </TabsContent>
          <TabsContent value="versions">
            <VersionsPanel
              essay={essay}
              draftBody={draft.body}
              beforeChange={flush}
              onRestore={(v) => void onRestore(v)}
              restoring={restore.isPending}
            />
          </TabsContent>
          <TabsContent value="ideas">
            <IdeasBoard essayId={essay.id} />
          </TabsContent>
          <TabsContent value="comments">
            {session?.user.id ? (
              <CommentsPanel target={{ studentId: session.user.id, kind: "essay", id: essay.id }} />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function EditorLoader() {
  const t = useT("essays")
  const id = useSearchParams().get("id")
  const query = useEssay(id)
  if (!id) return <StateView state="empty" title={t("missing")} action={<Link href="/essays/">{t("back")}</Link>} />
  if (query.isPending) return <StateView state="loading" rows={6} />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  // Keyed by id: opening another essay starts a fresh draft. Later cache updates must not reset typing.
  return <EssayEditor key={query.data.id} essay={query.data} />
}

export function EssayEditorPage() {
  return (
    <AdmissionShell>
      <EditorLoader />
    </AdmissionShell>
  )
}
