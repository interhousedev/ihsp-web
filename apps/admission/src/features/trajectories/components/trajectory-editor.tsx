"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, Checkbox, Input, ResponsiveDialog, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { CURATOR_ROLES } from "../../../config/nav"
import { QueryError } from "../../shell/components/query-error"
import { AdmissionShell } from "../../shell/components/admission-shell"
import {
  FIELDS,
  LIMITS,
  pick,
  useStaffTrajectory,
  useStaffTrajectoryMutations,
  type Field,
  type I18n,
  type NodeIn,
  type StageIn,
  type TrajectoryIn,
} from "../api"
import { dependentsOf, freshKey, moveNode, moveStage, slugify, toInput, withoutNode, withPrerequisites } from "../graph"
import { I18nFields, NodeDialog, type NodeDraft } from "./node-dialog"
import { Roadmap } from "./roadmap"

const SELECT = "border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
const blank: I18n = { en: "", ru: "", uz: "" }
const EMPTY: TrajectoryIn = {
  slug: "",
  field: "cs_it",
  title: blank,
  description: blank,
  published: false,
  stages: [{ id: "s1", title: { en: "Foundations", ru: "Основы", uz: "Asoslar" }, nodes: [] }],
  edges: [],
}

type StageEdit = { index: number | "new"; title: I18n }

function Editor({ id, initial }: { id: string; initial: TrajectoryIn }) {
  const t = useT("trajectories")
  const lang = useLocale()
  const router = useRouter()
  const errorMessage = useErrorMessage()
  const { create, update } = useStaffTrajectoryMutations()
  const [form, setForm] = useState<TrajectoryIn>(initial)
  const [slugTouched, setSlugTouched] = useState(id !== "")
  const [tab, setTab] = useState<"edit" | "preview">("edit")
  const [nodeEdit, setNodeEdit] = useState<{ stage: number; draft: NodeDraft } | null>(null)
  const [stageEdit, setStageEdit] = useState<StageEdit | null>(null)
  const nodes = form.stages.flatMap((s) => s.nodes)
  const set = (patch: Partial<TrajectoryIn>) => setForm((f) => ({ ...f, ...patch }))
  const candidates = useMemo(() => {
    if (!nodeEdit) return []
    const blocked = dependentsOf(nodeEdit.draft.node.id, form.edges)
    return nodes.filter((n) => n.id !== nodeEdit.draft.node.id && !blocked.has(n.id))
  }, [nodeEdit, form.edges, nodes])
  const busy = create.isPending || update.isPending

  const openNode = (stage: number, node?: NodeIn) => {
    const fresh: NodeIn = {
      id: freshKey(
        "n",
        nodes.map((n) => n.id),
      ),
      title: blank,
      kind: "topic",
      level: "beginner",
      description: blank,
      optional: false,
      resources: [],
    }
    const n = node ?? fresh
    setNodeEdit({
      stage,
      draft: { node: n, before: form.edges.filter((e) => e.after === n.id).map((e) => e.before) },
    })
  }

  const saveNode = ({ node, before }: NodeDraft) => {
    if (!nodeEdit) return
    setForm((f) => {
      const exists = f.stages.some((s) => s.nodes.some((x) => x.id === node.id))
      const stages = f.stages.map((s, i) =>
        exists
          ? { ...s, nodes: s.nodes.map((x) => (x.id === node.id ? node : x)) }
          : i === nodeEdit.stage
            ? { ...s, nodes: [...s.nodes, node] }
            : s,
      )
      return withPrerequisites({ ...f, stages }, node.id, before)
    })
    setNodeEdit(null)
  }

  const saveStage = () => {
    if (!stageEdit) return
    const { index, title } = stageEdit
    setForm((f) =>
      index === "new"
        ? {
            ...f,
            stages: [
              ...f.stages,
              {
                id: freshKey(
                  "s",
                  f.stages.map((s) => s.id),
                ),
                title,
                nodes: [],
              },
            ],
          }
        : { ...f, stages: f.stages.map((s, i) => (i === index ? { ...s, title } : s)) },
    )
    setStageEdit(null)
  }

  const removeStage = (index: number) =>
    setForm((f) => {
      const gone = (f.stages[index] as StageIn).nodes.map((n) => n.id)
      return gone.reduce((acc, nid) => withoutNode(acc, nid), {
        ...f,
        stages: f.stages.filter((_, i) => i !== index),
      })
    })

  const missingTitle = !form.title.en.trim() && !form.title.ru.trim() && !form.title.uz.trim()
  const badSlug = !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)

  function save() {
    if (missingTitle || badSlug) {
      toast.error(t(missingTitle ? "editor.titleRequired" : "editor.slugInvalid"))
      return
    }
    const onError = (e: unknown) => toast.error(errorMessage(e))
    if (id) update.mutate({ id, body: form }, { onSuccess: () => toast.success(t("editor.saved")), onError })
    else
      create.mutate(form, {
        onSuccess: (made) => {
          toast.success(t("editor.saved"))
          router.replace(`/staff/trajectories/edit/?id=${encodeURIComponent(made.id)}`)
        },
        onError,
      })
  }

  return (
    <div className={pageClass()}>
      <Link href="/staff/trajectories/" className="text-primary text-sm underline">
        {t("staff.back")}
      </Link>
      <AppPageHeader
        icon="route"
        title={pick(form.title, lang) || t("editor.newTitle")}
        actions={
          <>
            <div className="flex gap-1" role="group">
              {(["edit", "preview"] as const).map((k) => (
                <Button
                  key={k}
                  type="button"
                  size="sm"
                  className="min-h-11"
                  variant={tab === k ? "default" : "outline"}
                  aria-pressed={tab === k}
                  onClick={() => setTab(k)}
                >
                  {t(`editor.${k}`)}
                </Button>
              ))}
            </div>
            <Button type="button" size="sm" className="min-h-11" disabled={busy} onClick={save}>
              {t("editor.save")}
            </Button>
          </>
        }
      />
      {tab === "preview" ? (
        <div className="overflow-x-auto rounded-card border p-3">
          <Roadmap stages={form.stages} edges={form.edges} progress={{}} />
        </div>
      ) : (
        <>
          <section className="bg-card grid gap-4 rounded-card border p-4 md:grid-cols-2">
            <I18nFields
              label={t("editor.name")}
              value={form.title}
              invalid={missingTitle}
              onChange={(title) => set(slugTouched ? { title } : { title, slug: slugify(title.en) })}
            />
            <I18nFields
              label={t("editor.description")}
              value={form.description}
              multiline
              onChange={(description) => set({ description })}
            />
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t("editor.field")}
              <select className={SELECT} value={form.field} onChange={(e) => set({ field: e.target.value as Field })}>
                {FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {t(`field.${f}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t("editor.address")}
              <Input
                className="h-11"
                maxLength={80}
                aria-invalid={badSlug || undefined}
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set({ slug: e.target.value.toLowerCase() })
                }}
              />
              <span className="text-muted-foreground text-xs font-normal">{t("editor.addressHint")}</span>
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <Checkbox checked={form.published} onCheckedChange={(v) => set({ published: v === true })} />
              {t("editor.published")}
            </label>
          </section>
          <div className="flex gap-3 overflow-x-auto pb-2 max-md:flex-col">
            {form.stages.map((stage, si) => (
              <section
                key={stage.id}
                aria-label={pick(stage.title, lang)}
                className="bg-muted/40 flex w-full shrink-0 flex-col gap-2 rounded-card border p-3 md:w-72"
              >
                <div className="flex items-center gap-1">
                  <h2 className="min-w-0 flex-1 truncate font-semibold">
                    {si + 1}. {pick(stage.title, lang) || t("editor.untitled")}
                  </h2>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-11"
                    aria-label={t("editor.stageLeft")}
                    disabled={si === 0}
                    onClick={() => setForm((f) => moveStage(f, si, -1))}
                  >
                    ←
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-11"
                    aria-label={t("editor.stageRight")}
                    disabled={si === form.stages.length - 1}
                    onClick={() => setForm((f) => moveStage(f, si, 1))}
                  >
                    →
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => setStageEdit({ index: si, title: stage.title })}
                  >
                    {t("editor.renameStage")}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="min-h-11" onClick={() => removeStage(si)}>
                    {t("editor.removeStage")}
                  </Button>
                </div>
                <ul className="flex flex-col gap-2">
                  {stage.nodes.map((node, ni) => {
                    const before = form.edges.filter((e) => e.after === node.id).length
                    return (
                      <li key={node.id} className="bg-card flex flex-col gap-1 rounded-md border p-2">
                        <button
                          type="button"
                          className="flex min-h-11 flex-col text-left"
                          onClick={() => openNode(si, node)}
                        >
                          <span className="text-muted-foreground text-xs">
                            {t(`kind.${node.kind}`)} · {t(`level.${node.level}`)}
                            {node.optional ? ` · ${t("optional")}` : ""}
                          </span>
                          <span className="font-medium">{pick(node.title, lang) || t("editor.untitled")}</span>
                          <span className="text-muted-foreground text-xs">
                            {t("editor.summary", { before, resources: node.resources.length })}
                          </span>
                        </button>
                        <div className="flex flex-wrap gap-1">
                          {(
                            [
                              ["up", 0, -1, ni === 0, "↑"],
                              ["down", 0, 1, ni === stage.nodes.length - 1, "↓"],
                              ["left", -1, 0, si === 0, "←"],
                              ["right", 1, 0, si === form.stages.length - 1, "→"],
                            ] as const
                          ).map(([k, dx, dy, off, glyph]) => (
                            <Button
                              key={k}
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-11"
                              aria-label={t(`editor.move.${k}`)}
                              disabled={off}
                              onClick={() => setForm((f) => moveNode(f, node.id, dx, dy))}
                            >
                              {glyph}
                            </Button>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="min-h-11"
                            onClick={() => setForm((f) => withoutNode(f, node.id))}
                          >
                            {t("editor.remove")}
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  disabled={nodes.length >= LIMITS.nodes}
                  onClick={() => openNode(si)}
                >
                  {t("editor.addStep")}
                </Button>
              </section>
            ))}
            {form.stages.length < LIMITS.stages && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0 md:h-auto md:w-40"
                onClick={() => setStageEdit({ index: "new", title: blank })}
              >
                {t("editor.addStage")}
              </Button>
            )}
          </div>
        </>
      )}
      <NodeDialog
        draft={nodeEdit?.draft ?? null}
        candidates={candidates}
        onSave={saveNode}
        onClose={() => setNodeEdit(null)}
      />
      <ResponsiveDialog
        open={stageEdit !== null}
        onOpenChange={(o) => !o && setStageEdit(null)}
        title={t("editor.stageTitle")}
        onSubmit={(e) => {
          e.preventDefault()
          saveStage()
        }}
        footer={
          <Button
            type="submit"
            className="min-h-11"
            disabled={!stageEdit || !Object.values(stageEdit.title).some((v) => v.trim())}
          >
            {t("editor.done")}
          </Button>
        }
      >
        {stageEdit && (
          <I18nFields
            label={t("editor.stageName")}
            value={stageEdit.title}
            onChange={(title) => setStageEdit({ ...stageEdit, title })}
          />
        )}
      </ResponsiveDialog>
    </div>
  )
}

export function TrajectoryEditorBody() {
  const id = useSearchParams().get("id") ?? ""
  const query = useStaffTrajectory(id)
  // Derived, not state: after the first save the id changes and the editor must remount on the saved trajectory.
  const initial = useMemo(() => (id ? (query.data ? toInput(query.data) : null) : EMPTY), [id, query.data])
  if (id && query.isError) return <QueryError error={query.error} onRetry={() => void query.refetch()} />
  if (!initial) return <Skeleton className="m-4 h-64" />
  return <Editor key={id || "new"} id={id} initial={initial} />
}

export function TrajectoryEditorPage() {
  return (
    <AdmissionShell roles={[...CURATOR_ROLES]}>
      <TrajectoryEditorBody />
    </AdmissionShell>
  )
}
