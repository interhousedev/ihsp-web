"use client"

import { ApiError } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { useList } from "../../chooser/hooks"
import { ShareDialog } from "../../essay-invites/components/share-dialog"
import { EssayReviewPanel } from "../../essay-review"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useEssay, useRestore, useSaveEssay, type Essay, type EssayLink, type PlanSection } from "../api"
import { countWords } from "../diff"
import { CoachPanel } from "./coach-panel"
import { RefinePanel } from "./refine-panel"
import { CheckPanel } from "./check-panel"
import { EssayMeta } from "./essay-meta"
import { SuppInfo } from "./supp-info"
import { IdeasBoard } from "./ideas-board"
import { PlanPane } from "./plan-pane"
import { VersionsPanel } from "./versions-panel"
import { CommentsDrawer, DocumentRail, Paper, SidePanel, Toolbar, ToolsPanel, TopBar, type ToolTab } from "./editor"
import { useWide } from "./editor/use-wide"

type Panel = "comments" | "review" | "tools" | null

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
  const wide = useWide()
  const list = useList()
  const [panel, setPanel] = useState<Panel>(null)
  const [tab, setTab] = useState<ToolTab>("plan")
  const [railOpen, setRailOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

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

  const openPanel = (next: Panel, nextTab?: ToolTab) => {
    if (nextTab) setTab(nextTab)
    setPanel((current) => (current === next && !nextTab ? null : next))
  }
  const history = (command: "undo" | "redo") => {
    body.current?.focus()
    document.execCommand(command)
  }
  const entry = list.data?.find((item) => item.id === essay.list_entry_id)
  const panelTitle =
    panel === "comments" ? t("tabs.comments") : panel === "review" ? t("tabs.review") : t("editor.tools")

  return (
    <div className="bg-muted/40 flex min-h-[calc(100dvh-4rem)] flex-col">
      <TopBar
        title={draft.title}
        onTitle={(title) => update({ title })}
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
        onRail={() => setRailOpen(true)}
        onVersions={() => openPanel("tools", "versions")}
        onComments={() => openPanel("comments")}
        onShare={() => setShareOpen(true)}
        commentsOpen={panel === "comments"}
      />
      <div data-testid="editor-toolbar-bar" className="bg-background sticky top-[calc(var(--safe-top,0px)+4rem)] z-20">
        <Toolbar
          words={words}
          wordLimit={draft.word_limit}
          onUndo={() => history("undo")}
          onRedo={() => history("redo")}
          onReview={() => openPanel("review")}
          onTools={() => openPanel("tools")}
        />
      </div>
      <div className="flex min-w-0 flex-1 items-start gap-4 p-3 md:p-4">
        <SidePanel
          side="left"
          title={t("editor.rail.title")}
          open={wide || railOpen}
          onOpenChange={setRailOpen}
          className="w-52 shrink-0"
        >
          <DocumentRail currentId={essay.id} liveTitle={draft.title} onNavigate={() => setRailOpen(false)} />
        </SidePanel>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {essay.kind === "supplemental" || (essay.targets?.length ?? 0) > 0 ? <SuppInfo essay={essay} /> : null}
          <EssayMeta
            prompt={draft.prompt_text}
            showPrompt={(essay.targets?.length ?? 0) === 0}
            wordLimit={draft.word_limit}
            words={words}
            status={essay.status === "final" ? "final" : "draft"}
            onPrompt={(prompt_text) => update({ prompt_text })}
            onWordLimit={(word_limit) => update({ word_limit })}
          />
          <Paper
            title={draft.title}
            prompt=""
            body={draft.body}
            readOnly={state === "conflict"}
            onBody={(next) => update({ body: next })}
            textareaRef={body}
          />
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
        <SidePanel
          side="right"
          title={panelTitle}
          open={panel !== null}
          onOpenChange={(next) => setPanel(next ? panel : null)}
          className="bg-background border-hairline rounded-card w-96 max-w-[40%] shrink-0 border p-4"
        >
          {panel === "comments" ? <CommentsDrawer essayId={essay.id} /> : null}
          {panel === "review" ? (
            <EssayReviewPanel essayId={essay.id} entryInstitutionIds={entry ? [entry.institution.id] : []} />
          ) : null}
          {panel === "tools" ? (
            <ToolsPanel
              tab={tab}
              onTab={setTab}
              panes={{
                plan: (
                  <div className="flex flex-col gap-3">
                    <PlanPane plan={draft.plan} notes={draft.notes} links={draft.links} onChange={update} />
                    <CoachPanel essayId={essay.id} beforeRun={flush} onUseOutline={(plan) => update({ plan })} />
                  </div>
                ),
                check: <CheckPanel essayId={essay.id} beforeRun={flush} />,
                refine: <RefinePanel essayId={essay.id} />,
                versions: (
                  <VersionsPanel
                    essay={essay}
                    draftBody={draft.body}
                    beforeChange={flush}
                    onRestore={(v) => void onRestore(v)}
                    restoring={restore.isPending}
                  />
                ),
                ideas: <IdeasBoard essayId={essay.id} />,
              }}
            />
          ) : null}
        </SidePanel>
      </div>
      <ShareDialog essayId={essay.id} open={shareOpen} onOpenChange={setShareOpen} />
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
