"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, PageHeader, Skeleton, StateView, StatusBadge } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { CASELOAD_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useProposals, useReviewProposal, type Proposal, type ProposalStatus } from "../api"
import { ProposeDialog } from "./propose-dialog"

const TONES = { pending: "neutral", approved: "success", rejected: "destructive" } as const

function Row({ item, canReview }: { item: Proposal; canReview: boolean }) {
  const t = useT("catalogStaff")
  const errorMessage = useErrorMessage()
  const review = useReviewProposal()
  const title = typeof item.fields.name === "string" ? item.fields.name : item.target_id
  function decide(approve: boolean) {
    review.mutate(
      { id: item.id, approve, lock_version: item.lock_version },
      { onSuccess: () => toast.success(t("reviewed")), onError: (error) => toast.error(errorMessage(error)) },
    )
  }
  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-medium">{title}</span>
          <span className="text-muted-foreground text-xs">
            {t(`kind.${item.kind}`)} · {item.target_id ? t("editItem") : t("newItem")}
          </span>
        </div>
        <StatusBadge tone={TONES[item.status]} label={t(`status.${item.status}`)} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-sm">
        {Object.entries(item.fields).map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="text-muted-foreground">{key}</dt>
            <dd className="break-words">{String(value)}</dd>
          </div>
        ))}
      </dl>
      <a className="text-primary text-sm break-all underline" href={item.source_url} target="_blank" rel="noreferrer">
        {item.source_url}
      </a>
      {item.note && <p className="text-sm">{item.note}</p>}
      {canReview && item.status === "pending" && (
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={review.isPending} onClick={() => decide(true)}>
            {t("approve")}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={review.isPending} onClick={() => decide(false)}>
            {t("reject")}
          </Button>
        </div>
      )}
    </li>
  )
}

export function CatalogStaffBody() {
  const t = useT("catalogStaff")
  const [filter, setFilter] = useState<ProposalStatus | null>("pending")
  const [creating, setCreating] = useState(false)
  const query = useProposals(filter)
  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <StateView state="error" onRetry={() => void query.refetch()} />
  else if (query.data.items.length === 0)
    body = <StateView state="empty" title={t("emptyTitle")} description={t("emptyText")} />
  else {
    const canReview = query.data.can_review
    body = (
      <ul className="flex flex-col gap-2">
        {query.data.items.map((item) => (
          <Row key={item.id} item={item} canReview={canReview} />
        ))}
      </ul>
    )
  }
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button type="button" size="sm" onClick={() => setCreating(true)}>
            {t("proposeButton")}
          </Button>
        }
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          {t("filterPending")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === null ? "default" : "outline"}
          onClick={() => setFilter(null)}
        >
          {t("filterAll")}
        </Button>
      </div>
      {creating && <ProposeDialog open onOpenChange={setCreating} />}
      {body}
    </div>
  )
}

export function CatalogStaffPage() {
  return (
    <AdmissionShell roles={[...CASELOAD_ROLES]}>
      <CatalogStaffBody />
    </AdmissionShell>
  )
}
