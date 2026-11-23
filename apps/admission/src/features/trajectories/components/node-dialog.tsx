"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Button, Checkbox, Input, ResponsiveDialog, Skeleton, Textarea } from "@ihsp/ui"
import { useDeferredValue, useEffect, useState, type FormEvent } from "react"
import {
  LEVELS,
  LIMITS,
  NODE_KINDS,
  pick,
  useResourceSearch,
  type I18n,
  type NodeIn,
  type ResourceIo,
  type ResourceKind,
} from "../api"

const LANGS = ["en", "ru", "uz"] as const
const SELECT = "border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
const blank: I18n = { en: "", ru: "", uz: "" }

/** Inputs for one text in the three languages. */
export function I18nFields({
  label,
  value,
  onChange,
  multiline,
  invalid,
}: {
  label: string
  value: I18n
  onChange: (v: I18n) => void
  multiline?: boolean
  invalid?: boolean
}) {
  const t = useT("trajectories")
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      {LANGS.map((l) => (
        <label key={l} className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t(`lang.${l}`)}</span>
          {multiline ? (
            <Textarea
              rows={3}
              maxLength={LIMITS.description}
              value={value[l]}
              onChange={(e) => onChange({ ...value, [l]: e.target.value })}
            />
          ) : (
            <Input
              className="h-11"
              maxLength={LIMITS.title}
              aria-invalid={invalid && l === "en" ? true : undefined}
              value={value[l]}
              onChange={(e) => onChange({ ...value, [l]: e.target.value })}
            />
          )}
        </label>
      ))}
    </fieldset>
  )
}

/** Search LMS courses or library books and add one as a resource. */
function ResourcePicker({ kind, onPick }: { kind: Exclude<ResourceKind, "url">; onPick: (r: ResourceIo) => void }) {
  const t = useT("trajectories")
  const [q, setQ] = useState("")
  const query = useResourceSearch(kind, useDeferredValue(q.trim()), true)
  return (
    <div className="flex flex-col gap-2">
      <Input
        type="search"
        className="h-11"
        placeholder={t(kind === "lms_course" ? "editor.searchCourses" : "editor.searchBooks")}
        aria-label={t(kind === "lms_course" ? "editor.searchCourses" : "editor.searchBooks")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {query.isPending ? (
        <Skeleton className="h-16 w-full" />
      ) : query.isError || (query.data?.items.length ?? 0) === 0 ? (
        <p className="text-muted-foreground text-sm">{t("editor.noHits")}</p>
      ) : (
        <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
          {query.data?.items.map((h) => (
            <li key={h.ref}>
              <button
                type="button"
                className="hover:bg-muted flex min-h-11 w-full flex-col rounded-md border px-3 py-2 text-left text-sm"
                onClick={() => onPick({ kind: h.kind, ref: h.ref, title: h.title })}
              >
                <span className="font-medium">{h.title}</span>
                {h.subtitle && <span className="text-muted-foreground text-xs">{h.subtitle}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Add a web link: an address and its label. */
function LinkForm({ onAdd }: { onAdd: (r: ResourceIo) => void }) {
  const t = useT("trajectories")
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const valid = /^https?:\/\/[^\s/]+\.[^\s]+$/.test(url.trim())
  return (
    <div className="flex flex-col gap-2">
      <Input
        type="url"
        className="h-11"
        placeholder="https://"
        aria-label={t("editor.linkUrl")}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Input
        className="h-11"
        placeholder={t("editor.linkTitle")}
        aria-label={t("editor.linkTitle")}
        value={title}
        maxLength={300}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-11 self-start"
        disabled={!valid}
        onClick={() => {
          onAdd({ kind: "url", ref: url.trim(), title: title.trim() || url.trim() })
          setUrl("")
          setTitle("")
        }}
      >
        {t("editor.addLink")}
      </Button>
    </div>
  )
}

export type NodeDraft = { node: NodeIn; before: string[] }

/** Create or edit one step: texts, kind, level, prerequisites (checkboxes) and resources (pickers). */
export function NodeDialog({
  draft,
  candidates,
  onSave,
  onClose,
}: {
  draft: NodeDraft | null
  /** Steps that may be prerequisites (those depending on this one are left out). */
  candidates: NodeIn[]
  onSave: (d: NodeDraft) => void
  onClose: () => void
}) {
  const t = useT("trajectories")
  const lang = useLocale()
  const [form, setForm] = useState<NodeDraft | null>(draft)
  const [adding, setAdding] = useState<ResourceKind>("lms_course")
  const [tried, setTried] = useState(false)
  useEffect(() => {
    setForm(draft)
    setTried(false)
  }, [draft])
  if (!form)
    return (
      <ResponsiveDialog open={false} onOpenChange={onClose} title="">
        {null}
      </ResponsiveDialog>
    )
  const n = form.node
  const set = (patch: Partial<NodeIn>) => setForm({ ...form, node: { ...n, ...patch } })
  const missingTitle = !n.title.en.trim() && !n.title.ru.trim() && !n.title.uz.trim()
  const addResource = (r: ResourceIo) => {
    if (n.resources.length >= LIMITS.resources || n.resources.some((x) => x.kind === r.kind && x.ref === r.ref)) return
    set({ resources: [...n.resources, r] })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    setTried(true)
    if (missingTitle || !form) return
    onSave(form)
  }

  return (
    <ResponsiveDialog
      open={draft !== null}
      onOpenChange={(o) => !o && onClose()}
      title={t("editor.nodeTitle")}
      size="lg"
      onSubmit={submit}
      noValidate
      disablePointerDismissal
      footer={
        <>
          <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
            {t("editor.cancel")}
          </Button>
          <Button type="submit" className="min-h-11">
            {t("editor.done")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <I18nFields
          label={t("editor.stepName")}
          value={n.title}
          onChange={(title) => set({ title })}
          invalid={tried && missingTitle}
        />
        {tried && missingTitle && <p className="text-destructive text-sm">{t("editor.titleRequired")}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("editor.kind")}
            <select className={SELECT} value={n.kind} onChange={(e) => set({ kind: e.target.value as NodeIn["kind"] })}>
              {NODE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`kind.${k}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("editor.level")}
            <select
              className={SELECT}
              value={n.level}
              onChange={(e) => set({ level: e.target.value as NodeIn["level"] })}
            >
              {LEVELS.map((k) => (
                <option key={k} value={k}>
                  {t(`level.${k}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <Checkbox checked={n.optional} onCheckedChange={(v) => set({ optional: v === true })} />
          {t("editor.optional")}
        </label>
        <I18nFields
          label={t("editor.description")}
          value={n.description ?? blank}
          onChange={(description) => set({ description })}
          multiline
        />
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-medium">{t("editor.prerequisites")}</legend>
          {candidates.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("editor.noCandidates")}</p>
          ) : (
            <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {candidates.map((c) => (
                <li key={c.id}>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.before.includes(c.id)}
                      onCheckedChange={(v) =>
                        setForm({
                          ...form,
                          before: v === true ? [...form.before, c.id] : form.before.filter((b) => b !== c.id),
                        })
                      }
                    />
                    {pick(c.title, lang) || t("editor.untitled")}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{t("resources")}</legend>
          {n.resources.length > 0 && (
            <ul className="flex flex-col gap-1">
              {n.resources.map((r) => (
                <li key={`${r.kind}:${r.ref}`} className="flex items-center gap-2 rounded-md border px-3 py-1 text-sm">
                  <span className="text-muted-foreground text-xs">{t(`resourceKind.${r.kind}`)}</span>
                  <span className="min-w-0 flex-1 truncate">{r.title}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="min-h-11"
                    onClick={() => set({ resources: n.resources.filter((x) => x !== r) })}
                  >
                    {t("editor.remove")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {n.resources.length < LIMITS.resources && (
            <>
              <div className="flex flex-wrap gap-2" role="group">
                {(["lms_course", "library_book", "url"] as const).map((k) => (
                  <Button
                    key={k}
                    type="button"
                    size="sm"
                    className="min-h-11"
                    variant={adding === k ? "default" : "outline"}
                    aria-pressed={adding === k}
                    onClick={() => setAdding(k)}
                  >
                    {t(`resourceKind.${k}`)}
                  </Button>
                ))}
              </div>
              {adding === "url" ? (
                <LinkForm onAdd={addResource} />
              ) : (
                <ResourcePicker key={adding} kind={adding} onPick={addResource} />
              )}
            </>
          )}
        </fieldset>
      </div>
    </ResponsiveDialog>
  )
}
