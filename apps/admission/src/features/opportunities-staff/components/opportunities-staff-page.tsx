"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Skeleton, StateView, StatusBadge } from "@ihsp/ui"
import Link from "next/link"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { CURATOR_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import {
  localName,
  useArchiveOpportunity,
  useCreateTaxonomyNode,
  useDeleteTaxonomyNode,
  useReviewSubmission,
  useSubmissions,
  useTaxonomy,
  type Names,
  type Submission,
  type SubmissionStatus,
  type TaxonomyLevel,
} from "../../opportunities/api"
import { SubmitDialog } from "../../opportunities/components/submit-dialog"
import { OrgsEditor } from "./orgs-editor"
import { QueryError } from "../../shell/components/query-error"

const TONES = { pending: "neutral", approved: "success", rejected: "destructive" } as const
const LOCALES = ["uz", "ru", "en"] as const

function Row({ item, canModerate }: { item: Submission; canModerate: boolean }) {
  const t = useT("opportunitiesStaff")
  const tk = useT("opportunities")
  const errorMessage = useErrorMessage()
  const review = useReviewSubmission()
  const archive = useArchiveOpportunity()
  const [reason, setReason] = useState("")
  const onError = (error: unknown) => toast.error(errorMessage(error))
  function decide(approve: boolean) {
    review.mutate(
      { id: item.id, approve, reason: approve ? null : reason.trim(), lock_version: item.lock_version },
      { onSuccess: () => toast.success(t("reviewed")), onError },
    )
  }
  const f = item.fields
  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-medium">{f.title}</span>
          <span className="text-muted-foreground text-xs">
            {tk(`kind.${f.kind}`)} · {item.target_id ? t("editItem") : t("newItem")} ·{" "}
            {t(`role.${item.submitter_role}`)}
          </span>
        </div>
        <StatusBadge tone={TONES[item.status]} label={t(`status.${item.status}`)} />
      </div>
      {f.summary && <p className="text-sm">{f.summary}</p>}
      {f.url && (
        <a className="text-primary text-sm break-all underline" href={f.url} target="_blank" rel="noreferrer">
          {f.url}
        </a>
      )}
      {item.note && <p className="text-sm">{item.note}</p>}
      {item.reason && (
        <p className="text-sm">
          {t("reasonLabel")}: {item.reason}
        </p>
      )}
      {canModerate && item.status === "pending" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label={t("reasonLabel")}
            placeholder={t("reasonLabel")}
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={review.isPending} onClick={() => decide(true)}>
              {t("approve")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={review.isPending || reason.trim() === ""}
              onClick={() => decide(false)}
            >
              {t("reject")}
            </Button>
          </div>
        </div>
      )}
      {canModerate && item.status === "approved" && item.applied_id && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="self-start"
          disabled={archive.isPending}
          onClick={() =>
            archive.mutate(
              { id: item.applied_id!, archived: true },
              { onSuccess: () => toast.success(t("archived")), onError },
            )
          }
        >
          {t("archive")}
        </Button>
      )}
    </li>
  )
}

function TaxonomyEditor() {
  const t = useT("opportunitiesStaff")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const taxonomy = useTaxonomy()
  const create = useCreateTaxonomyNode()
  const remove = useDeleteTaxonomyNode()
  const [parent, setParent] = useState<{ id: string | null; level: TaxonomyLevel }>({ id: null, level: "field" })
  const [names, setNames] = useState<Names>({ uz: "", ru: "", en: "" })
  const onError = (error: unknown) => toast.error(errorMessage(error))

  function add(event: FormEvent) {
    event.preventDefault()
    create.mutate(
      { level: parent.level, parent_id: parent.id, names },
      { onSuccess: () => setNames({ uz: "", ru: "", en: "" }), onError },
    )
  }

  const node = (id: string, name: Names, child?: TaxonomyLevel) => (
    <span className="flex items-center gap-1">
      <span>{localName(name, locale)}</span>
      {child && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={t("addChild")}
          onClick={() => setParent({ id, level: child })}
        >
          <Icons.add aria-hidden className="size-4" />
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label={t("delete")}
        onClick={() => remove.mutate(id, { onError })}
      >
        <Icons.trash aria-hidden className="size-4" />
      </Button>
    </span>
  )

  return (
    <section className="bg-card flex flex-col gap-3 rounded-card border p-4">
      <h2 className="font-medium">{t("taxonomyTitle")}</h2>
      <ul className="flex flex-col gap-1 text-sm">
        {taxonomy.data?.fields.map((f) => (
          <li key={f.id}>
            {node(f.id, f.name, "subfield")}
            <ul className="ml-4">
              {f.subfields.map((s) => (
                <li key={s.id}>
                  {node(s.id, s.name, "subject")}
                  <ul className="ml-4">
                    {s.subjects.map((j) => (
                      <li key={j.id}>{node(j.id, j.name)}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <form className="flex flex-col gap-2" onSubmit={add}>
        <p className="text-muted-foreground text-xs">
          {t(`newNode.${parent.level}`)}
          {parent.id && (
            <Button type="button" size="sm" variant="link" onClick={() => setParent({ id: null, level: "field" })}>
              {t("resetParent")}
            </Button>
          )}
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {LOCALES.map((l) => (
            <Input
              key={l}
              aria-label={t(`nameIn.${l}`)}
              placeholder={t(`nameIn.${l}`)}
              value={names[l] ?? ""}
              onChange={(e) => setNames({ ...names, [l]: e.target.value })}
            />
          ))}
        </div>
        <Button
          type="submit"
          size="sm"
          className="self-start"
          disabled={create.isPending || !LOCALES.every((l) => names[l]?.trim())}
        >
          {t("addNode")}
        </Button>
      </form>
    </section>
  )
}

export function OpportunitiesStaffBody() {
  const t = useT("opportunitiesStaff")
  const [filter, setFilter] = useState<SubmissionStatus | null>("pending")
  const [creating, setCreating] = useState(false)
  const query = useSubmissions(filter)
  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (query.data.items.length === 0)
    body = <StateView state="empty" title={t("emptyTitle")} description={t("emptyText")} />
  else
    body = (
      <ul className="flex flex-col gap-2">
        {query.data.items.map((item) => (
          <Row key={item.id} item={item} canModerate={query.data.can_moderate} />
        ))}
      </ul>
    )
  return (
    <div className={pageClass("narrow")}>
      <AppPageHeader
        icon="sparkles"
        title={t("title")}
        actions={
          <Button type="button" size="sm" onClick={() => setCreating(true)}>
            {t("addEntry")}
          </Button>
        }
      />
      <Link href="/staff/opportunities/reports/" className="text-primary text-sm hover:underline">
        {t("reports.title")}
      </Link>
      <div className="flex gap-2">
        {(["pending", null] as const).map((value) => (
          <Button
            key={String(value)}
            type="button"
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {value ? t("filterPending") : t("filterAll")}
          </Button>
        ))}
      </div>
      {creating && <SubmitDialog open onOpenChange={setCreating} />}
      {body}
      {query.data?.can_moderate && <OrgsEditor />}
      {query.data?.can_moderate && <TaxonomyEditor />}
    </div>
  )
}

export function OpportunitiesStaffPage() {
  return (
    <AdmissionShell roles={[...CURATOR_ROLES]}>
      <OpportunitiesStaffBody />
    </AdmissionShell>
  )
}
