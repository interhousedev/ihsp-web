"use client"

import { isApiError } from "@ihsp/api"
import { formatDate, useErrorMessage, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  Icons,
  Input,
  LoadingButton,
  ResponsiveDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@ihsp/ui"
import Link from "next/link"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { usePersonalMutations, type PersonalEntry, type PersonalFields, type PersonalKind } from "../api"

const KINDS: PersonalKind[] = [
  "exam",
  "certification",
  "course",
  "event",
  "recurring",
  "program",
  "scholarship",
  "research",
]

const EMPTY: PersonalFields = {
  kind: "event",
  title: "",
  provider: null,
  url: null,
  summary: null,
  note: null,
  starts_on: null,
  ends_on: null,
  registration_deadline: null,
  planned_grade: null,
  planned_term: null,
}

const PROPOSAL_VARIANT = { pending: "secondary", approved: "default", rejected: "destructive" } as const

/** Text and date inputs keep "" while typing; the API takes null for an empty optional field. */
function orNull(value: string | null): string | null {
  const trimmed = value?.trim() ?? ""
  return trimmed === "" ? null : trimmed
}

function FindDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: PersonalEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("opportunities.personal")
  const tOpp = useT("opportunities")
  const errorMessage = useErrorMessage()
  const { add, update } = usePersonalMutations()
  const [form, setForm] = useState<PersonalFields>(() =>
    entry
      ? (Object.fromEntries(
          Object.keys(EMPTY).map((key) => [key, entry[key as keyof PersonalFields]]),
        ) as PersonalFields)
      : EMPTY,
  )
  const [propose, setPropose] = useState(false)
  const set = <K extends keyof PersonalFields>(key: K, value: PersonalFields[K]) =>
    setForm((current) => ({ ...current, [key]: value }))
  const pending = add.isPending || update.isPending

  function submit(event: FormEvent) {
    event.preventDefault()
    const body: PersonalFields = {
      ...form,
      title: form.title.trim(),
      provider: orNull(form.provider),
      url: orNull(form.url),
      summary: orNull(form.summary),
      note: orNull(form.note),
      starts_on: orNull(form.starts_on),
      ends_on: orNull(form.ends_on),
      registration_deadline: orNull(form.registration_deadline),
    }
    if (entry) {
      update.mutate(
        { ...body, id: entry.id, lock_version: entry.lock_version },
        {
          onSuccess: () => {
            toast.success(t("saved"))
            onOpenChange(false)
          },
          onError: (error) => {
            if (isApiError(error) && error.status === 409) {
              toast.error(t("stale"))
              onOpenChange(false)
            } else toast.error(errorMessage(error))
          },
        },
      )
      return
    }
    add.mutate(
      { ...body, propose },
      {
        onSuccess: (result) => {
          if (result.merged && result.planned_opportunity_id) {
            const id = result.planned_opportunity_id
            toast.success(t("merged"), {
              action: {
                label: t("openMerged"),
                onClick: () => window.location.assign(`/opportunities/view/?id=${encodeURIComponent(id)}`),
              },
            })
          } else toast.success(propose ? t("addedProposed") : t("added"))
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={entry ? t("editTitle") : t("addTitle")}
      description={t("dialogHint")}
      onSubmit={submit}
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <LoadingButton type="submit" loading={pending} disabled={form.title.trim() === ""}>
            {t("save")}
          </LoadingButton>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {tOpp("titleLabel")}
          <Input required maxLength={300} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          <span id="personal-kind">{tOpp("kindLabel")}</span>
          <Select value={form.kind} onValueChange={(v) => v && set("kind", v as PersonalKind)}>
            <SelectTrigger aria-labelledby="personal-kind" className="w-full">
              <SelectValue>{tOpp(`kind.${form.kind}`)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {tOpp(`kind.${kind}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          {tOpp("providerLabel")}
          <Input maxLength={200} value={form.provider ?? ""} onChange={(e) => set("provider", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("urlLabel")}
          <Input type="url" inputMode="url" value={form.url ?? ""} onChange={(e) => set("url", e.target.value)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            {t("startsLabel")}
            <Input type="date" value={form.starts_on ?? ""} onChange={(e) => set("starts_on", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("endsLabel")}
            <Input type="date" value={form.ends_on ?? ""} onChange={(e) => set("ends_on", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {tOpp("registrationLabel")}
            <Input
              type="date"
              value={form.registration_deadline ?? ""}
              onChange={(e) => set("registration_deadline", e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          {tOpp("summaryLabel")}
          <Textarea maxLength={2000} value={form.summary ?? ""} onChange={(e) => set("summary", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("noteLabel")}
          <Textarea maxLength={2000} value={form.note ?? ""} onChange={(e) => set("note", e.target.value)} />
        </label>
        {entry ? null : (
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Checkbox checked={propose} onCheckedChange={(on) => setPropose(on === true)} />
            {t("propose")}
          </label>
        )}
      </div>
    </ResponsiveDialog>
  )
}

function FindRow({ entry, onEdit }: { entry: PersonalEntry; onEdit: () => void }) {
  const t = useT("opportunities.personal")
  const tOpp = useT("opportunities")
  const errorMessage = useErrorMessage()
  const { remove } = usePersonalMutations()
  const [confirming, setConfirming] = useState(false)
  const dates = [entry.starts_on, entry.registration_deadline].filter((day): day is string => !!day)
  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-3 text-sm">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {entry.url ? (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="line-clamp-2 font-medium break-words hover:underline"
            >
              {entry.title}
            </a>
          ) : (
            <span className="line-clamp-2 font-medium break-words">{entry.title}</span>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{tOpp(`kind.${entry.kind}`)}</Badge>
            <Badge variant="outline">{t("unverified")}</Badge>
            {entry.proposal && (
              <Badge variant={PROPOSAL_VARIANT[entry.proposal.status]}>{t(`proposal.${entry.proposal.status}`)}</Badge>
            )}
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={t("edit", { title: entry.title })}
          onClick={onEdit}
        >
          <Icons.edit aria-hidden className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={t("delete", { title: entry.title })}
          onClick={() => setConfirming(true)}
        >
          <Icons.trash aria-hidden className="size-4" />
        </Button>
      </div>
      {(entry.provider || dates.length > 0) && (
        <p className="text-muted-foreground">
          {[
            entry.provider,
            entry.starts_on && formatDate(entry.starts_on),
            entry.registration_deadline && t("deadline", { day: formatDate(entry.registration_deadline) }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("deleteTitle", { title: entry.title })}
        description={entry.proposal?.status === "pending" ? t("deletePending") : undefined}
        confirmLabel={t("deleteConfirm")}
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(entry.id, {
            onSuccess: () => setConfirming(false),
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      />
    </li>
  )
}

/** "Your own finds": opportunities the student found outside the school list; not verified by the school. */
export function PersonalFinds({ entries }: { entries: PersonalEntry[] }) {
  const t = useT("opportunities.personal")
  const [editing, setEditing] = useState<PersonalEntry | "new" | null>(null)
  return (
    <section aria-labelledby="personal-finds" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="personal-finds" className="font-medium">
          {t("title")}
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing("new")}>
          <Icons.add aria-hidden />
          {t("add")}
        </Button>
      </div>
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("empty")}{" "}
          <Link href="/opportunities/" className="text-primary hover:underline">
            {t("searchFirst")}
          </Link>
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <FindRow key={entry.id} entry={entry} onEdit={() => setEditing(entry)} />
          ))}
        </ul>
      )}
      {editing !== null && (
        <FindDialog
          key={editing === "new" ? "new" : `${editing.id}:${editing.lock_version}`}
          entry={editing === "new" ? null : editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </section>
  )
}
