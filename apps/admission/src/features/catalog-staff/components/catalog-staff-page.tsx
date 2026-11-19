"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, Input, Label, Skeleton, StateView, StatusBadge } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { ScrollFade } from "../../../components/scroll-fade"
import { CURATOR_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useInstitution } from "../../chooser/hooks"
import { useProposals, useReviewProposal, type Proposal, type ProposalStatus } from "../api"
import { LogoTuner } from "./logo-tuner"
import { SuppPromptsEditor } from "./supp-prompts-editor"
import { CatalogTokenCard } from "./catalog-token-card"
import { ProposalFacts } from "./proposal-facts"
import { ProposalPrompts } from "./proposal-prompts"
import { ProposeDialog } from "./propose-dialog"
import { QueryError } from "../../shell/components/query-error"

const FIELD_LABELS: Record<string, string> = {
  name: "nameLabel",
  country: "countryLabel",
  city: "cityLabel",
  logo_url: "logoLabel",
  cover_url: "coverLabel",
  provider: "providerLabel",
  basis: "basisLabel",
}

const TONES = { pending: "neutral", approved: "success", rejected: "destructive" } as const

function Row({ item, canReview }: { item: Proposal; canReview: boolean }) {
  const t = useT("catalogStaff")
  const errorMessage = useErrorMessage()
  const review = useReviewProposal()
  const tf = useT("catalogFacts")
  const target = useInstitution(item.target_id)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const name = typeof item.fields.name === "string" && item.fields.name ? item.fields.name : null
  const title = name ?? target.data?.name ?? t(`kind.${item.kind}`)
  function fieldLabel(key: string): string {
    const own = FIELD_LABELS[key]
    if (own) return t(own)
    if (key === "website_domain") return tf("domainLabel")
    if (key === "aliases") return tf("aliasesLabel")
    return key.replace(/_/g, " ")
  }
  function fieldValue(key: string, value: unknown): string {
    if (Array.isArray(value)) return value.join(", ")
    if ((key === "provider" || key === "basis") && typeof value === "string") return t(`${key}.${value}`)
    return String(value)
  }
  function decide(approve: boolean, note: string | null = null) {
    review.mutate(
      { id: item.id, approve, lock_version: item.lock_version, ...(approve ? {} : { note }) },
      {
        onSuccess: () => {
          setRejecting(false)
          toast.success(t("reviewed"))
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
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
        {Object.entries(item.fields)
          .filter(([, value]) => value !== null && value !== "")
          .map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-muted-foreground">{fieldLabel(key)}</dt>
              <dd className="break-words">{fieldValue(key, value)}</dd>
            </div>
          ))}
      </dl>
      <a
        className="text-primary text-sm break-all underline"
        href={item.source_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {item.source_url}
      </a>
      {item.facts && Object.keys(item.facts).length > 0 && <ProposalFacts facts={item.facts} />}
      {item.supp_prompts && item.supp_prompts.length > 0 && <ProposalPrompts prompts={item.supp_prompts} />}
      {item.note && <p className="text-sm">{item.note}</p>}
      {canReview && item.status === "pending" && (
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={review.isPending} onClick={() => decide(true)}>
            {t("approve")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={review.isPending}
            onClick={() => setRejecting(true)}
          >
            {t("reject")}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title={t("rejectTitle")}
        description={t("rejectDescription")}
        confirmLabel={t("reject")}
        destructive
        loading={review.isPending}
        onConfirm={() => decide(false, reason.trim() || null)}
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor={`reject-${item.id}`}>{t("rejectReasonLabel")}</Label>
          <Input
            id={`reject-${item.id}`}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      </ConfirmDialog>
    </li>
  )
}

export function CatalogStaffBody() {
  const t = useT("catalogStaff")
  const [filter, setFilter] = useState<ProposalStatus | null>("pending")
  const [creating, setCreating] = useState(false)
  const [tuning, setTuning] = useState(false)
  const [prompting, setPrompting] = useState(false)
  const query = useProposals(filter)
  let body
  if (query.isPending) body = <Skeleton className="h-32 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (query.data.items.length === 0)
    body = (
      <StateView
        state="empty"
        icon={<Icons.inbox className="size-8" />}
        title={t("emptyTitle")}
        description={t("emptyText")}
      />
    )
  else {
    const canReview = query.data.can_review
    body = (
      <ScrollFade maxHeight="calc(100dvh - 20rem)">
        <ul className="flex flex-col gap-2">
          {query.data.items.map((item) => (
            <Row key={item.id} item={item} canReview={canReview} />
          ))}
        </ul>
      </ScrollFade>
    )
  }
  return (
    <div className={pageClass("narrow")}>
      <AppPageHeader
        icon="search"
        title={t("title")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setPrompting(true)}>
              {t("suppButton")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setTuning(true)}>
              {t("logoButton")}
            </Button>
            <Button type="button" size="sm" onClick={() => setCreating(true)}>
              {t("proposeButton")}
            </Button>
          </div>
        }
      />
      <div className="flex flex-wrap gap-2">
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
      {tuning && <LogoTuner open onOpenChange={setTuning} />}
      {prompting && <SuppPromptsEditor open onOpenChange={setPrompting} />}
      {body}
      <CatalogTokenCard />
    </div>
  )
}

export function CatalogStaffPage() {
  return (
    <AdmissionShell roles={[...CURATOR_ROLES]}>
      <CatalogStaffBody />
    </AdmissionShell>
  )
}
