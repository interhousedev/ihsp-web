"use client"

import { useT } from "@ihsp/i18n"
import { PageHeader, Icons, StateView } from "@ihsp/ui"
import Link from "next/link"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useAssignedRequests, useMyHelpRequests, type HelpRequest } from "../api"
import { GuestLinkManager } from "./guest-link-manager"
import { HelpRequestButton } from "./help-request-dialog"
import { HelpStatusBadge, useValueLabel } from "./status-badges"

export function HelpRequestCard({ request }: { request: HelpRequest }) {
  const kindLabel = useValueLabel("kind")
  return (
    <li>
      <Link
        href={`/help/request/?id=${encodeURIComponent(request.id)}`}
        className="border-hairline hover:bg-muted/40 flex min-h-11 flex-col gap-1.5 rounded-card border p-3 transition-colors motion-reduce:transition-none"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">{kindLabel(request.kind)}</span>
          <HelpStatusBadge status={request.status} />
        </div>
        <p className="text-muted-foreground line-clamp-2 text-sm">{request.brief}</p>
      </Link>
    </li>
  )
}

function RequestList({ items, emptyText }: { items: HelpRequest[]; emptyText: string }) {
  if (items.length === 0) return <StateView state="empty" emptyText={emptyText} icon={<Icons.inbox aria-hidden />} />
  return (
    <ul className="flex flex-col gap-2">
      {items.map((request) => (
        <HelpRequestCard key={request.id} request={request} />
      ))}
    </ul>
  )
}

function MyRequests() {
  const t = useT("help")
  const mine = useMyHelpRequests()
  return (
    <section aria-labelledby="help-mine" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="help-mine" className="text-lg font-semibold">
          {t("board.mine")}
        </h2>
        <HelpRequestButton />
      </div>
      {mine.isPending ? (
        <StateView state="loading" rows={2} />
      ) : mine.isError ? (
        <StateView state="error" error={mine.error} onRetry={() => mine.refetch()} />
      ) : (
        <RequestList items={mine.data.items} emptyText={t("board.mineEmpty")} />
      )}
    </section>
  )
}

/** The inbox of a mentor or counselor; people without that role simply have nothing assigned and no section. */
function Assigned() {
  const t = useT("help")
  const assigned = useAssignedRequests()
  if (!assigned.data || assigned.data.items.length === 0) return null
  return (
    <section aria-labelledby="help-assigned" className="flex flex-col gap-3">
      <h2 id="help-assigned" className="text-lg font-semibold">
        {t("board.assigned")}
      </h2>
      <RequestList items={assigned.data.items} emptyText={t("board.assignedEmpty")} />
    </section>
  )
}

export function HelpPage() {
  const t = useT("help")
  return (
    <AdmissionShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 md:p-6">
        <PageHeader title={t("board.title")} />
        <Assigned />
        <MyRequests />
        <section aria-labelledby="help-links" className="flex flex-col gap-3">
          <h2 id="help-links" className="text-lg font-semibold">
            {t("board.links")}
          </h2>
          <GuestLinkManager />
        </section>
      </div>
    </AdmissionShell>
  )
}
