"use client"

import { ApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Icons, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useList } from "../../chooser/hooks"
import { ShareDialog } from "../../essay-invites/components/share-dialog"
import { EssayReviewPanel } from "../../essay-review"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useEssay, useRestore, useSaveEssay, type Essay, type EssayLink, type PlanSection } from "../api"
import { countWords } from "../diff"
import { CoachPanel } from "./coach-panel"
import { RefinePanel } from "./refine-panel"
import { SuppInfo } from "./supp-info"
import { CheckPanel } from "./check-panel"
import { EssayMeta } from "./essay-meta"
import { PlanPane } from "./plan-pane"
import { VersionsPanel } from "./versions-panel"
import {
  AnnotatedText,
  CommentsDrawer,
  Dock,
  isDockView,
  PeekNote,
  PreviewDialog,
  ReadPanel,
  ScoreBar,
  TopBar,
  useReadState,
  useSplit,
  type DockView,
} from "./editor"
import { useCopyFinal } from "./editor/use-copy-final"
import { ExamplesPanel } from "../flow/examples-panel"
import { IdeasPanel } from "../flow/ideas-panel"

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
  const body = useRef<HTMLTextAreaElement>(null)
  const split = useSplit()
  const list = useList()
  const te = useT("essayEditor")
  const params = useSearchParams()
  const tab = params.get("tab")
  const found = params.get("q")
  const [view, setView] = useState<DockView | null>(isDockView(tab) ? tab : null)
  const [shareOpen, setShareOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [peekOpen, setPeekOpen] = useState(false)
  const copyFinal = useCopyFinal(draft.body)

  // Arriving from the global search (`?q=`): select the first match in the body and scroll to it.
  useEffect(() => {
    const area = body.current
    if (!found || !area) return
    const at = area.value.toLocaleLowerCase().indexOf(found.toLocaleLowerCase())
    if (at < 0) return
    area.focus({ preventScroll: true })
    area.setSelectionRange(at, at + found.length)
    const line = area.value.slice(0, at).split("\n").length
    area.scrollTop = Math.max(0, (line - 3) * 24)
    area.scrollIntoView?.({ block: "center" })
  }, [found])

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

  const history = (command: "undo" | "redo") => {
    body.current?.focus()
    document.execCommand(command)
  }
  const entry = list.data?.find((item) => item.id === essay.list_entry_id)
  const targets = essay.targets ?? []
  const institutionIds = [
    ...new Set([...targets.map((tg) => tg.institution_id), entry?.institution.id].filter((id): id is string => !!id)),
  ]
  const readState = useReadState(essay.id, draft.body, flush, institutionIds)
  const [selected, setSelected] = useState<number | null>(null)
  const go = (next: DockView) => {
    setView(next)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", next)
    window.history.replaceState(window.history.state, "", url)
  }
  const dockTitle = view === "review" ? t("tabs.review") : te(`tab.${view ?? "read"}`)

  const panes: Record<DockView, ReactNode> = {
    read: (
      <div className="flex flex-col gap-5">
        <ReadPanel essayId={essay.id} state={readState} selected={selected} onSelect={setSelected} />
        <CheckPanel essayId={essay.id} beforeRun={flush} />
        <RefinePanel essayId={essay.id} />
        <SuppInfo essay={essay} />
        <Button type="button" variant="outline" className="self-start" onClick={() => go("review")}>
          {te("detailedReview")}
        </Button>
      </div>
    ),
    plan: (
      <div className="flex flex-col gap-3">
        <PlanPane plan={draft.plan} notes={draft.notes} links={draft.links} onChange={update} />
        <CoachPanel essayId={essay.id} beforeRun={flush} onUseOutline={(plan) => update({ plan })} />
      </div>
    ),
    versions: (
      <VersionsPanel
        essay={essay}
        draftBody={draft.body}
        beforeChange={flush}
        onRestore={(v) => void onRestore(v)}
        restoring={restore.isPending}
      />
    ),
    examples: <ExamplesPanel institutionIds={institutionIds.length > 0 ? institutionIds : undefined} />,
    ideas: <IdeasPanel />,
    comments: <CommentsDrawer essayId={essay.id} />,
    review: <EssayReviewPanel essayId={essay.id} entryInstitutionIds={entry ? [entry.institution.id] : []} />,
  }

  return (
    <div className="bg-muted/40 flex min-h-[calc(100dvh-4rem)] flex-col md:h-[calc(100dvh-var(--shell-top-reserve,0px))] md:min-h-0">
      <TopBar
        title={draft.title}
        onTitle={(title) => update({ title })}
        words={words}
        wordLimit={draft.word_limit}
        saveState={state}
        status={
          <>
            {status}
            {state === "error" ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => void flush().catch(() => undefined)}>
                {t("save.retry")}
              </Button>
            ) : null}
          </>
        }
        onUndo={() => history("undo")}
        onRedo={() => history("redo")}
        onCopy={() => void copyFinal()}
        onPreview={() => setPreviewOpen(true)}
        onPeek={() => setPeekOpen((v) => !v)}
        onVersions={() => go("versions")}
        onComments={() => go(view === "comments" ? "read" : "comments")}
        onShare={() => setShareOpen(true)}
        commentsOpen={view === "comments"}
        copyDisabled={!draft.body.trim()}
      />
      <div className="flex min-h-0 min-w-0 flex-1 gap-4 p-3 md:p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3 md:overflow-y-auto md:pr-1 md:[scrollbar-gutter:stable]">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            <ScoreBar essayId={essay.id} state={readState} onRead={() => go("read")} onUnis={() => go("read")} />
            <EssayMeta
              prompt={draft.prompt_text}
              summary={targets.length > 0 ? targets.map((tg) => tg.prompt).join(" · ") : undefined}
              showPrompt={targets.length === 0}
              wordLimit={draft.word_limit}
              words={words}
              onPrompt={(prompt_text) => update({ prompt_text })}
              onWordLimit={(word_limit) => update({ word_limit })}
            />
          </div>
          {readState.stale ? (
            <p
              role="status"
              data-testid="editor-stale-banner"
              className="bg-warning-muted text-warning mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1">{te("staleBanner")}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={readState.run.isPending}
                onClick={() => void readState.start()}
              >
                {te("staleAction")}
              </Button>
            </p>
          ) : null}
          <article className="bg-card text-card-foreground ring-border mx-auto w-full max-w-3xl rounded-sm px-8 py-8 shadow-md ring-1 md:px-10 md:py-10 lg:px-14 lg:py-12">
            <AnnotatedText
              body={draft.body}
              readOnly={state === "conflict"}
              onBody={(next) => update({ body: next })}
              textareaRef={body}
              read={readState.read}
              stale={readState.stale}
              selected={selected}
              onSelect={(n) => {
                setSelected(n)
                go("read")
              }}
            />
          </article>
          {state === "conflict" ? (
            <Alert variant="destructive" className="mx-auto w-full max-w-3xl">
              <AlertDescription className="flex flex-col gap-2">
                {t("save.conflictText")}
                <Button type="button" size="sm" className="self-start" onClick={() => void reload()}>
                  {t("save.reload")}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          {lost && state !== "conflict" ? (
            <details className="border-hairline rounded-card mx-auto w-full max-w-3xl border p-3 text-sm">
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
        <Dock split={split} view={view} onView={go} onClose={() => setView(null)} title={dockTitle} panes={panes} />
      </div>
      <ShareDialog essayId={essay.id} open={shareOpen} onOpenChange={setShareOpen} />
      <PeekNote open={peekOpen} onClose={() => setPeekOpen(false)} currentId={essay.id} />
      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={draft.title}
        body={draft.body}
        limit={draft.word_limit}
      />
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
