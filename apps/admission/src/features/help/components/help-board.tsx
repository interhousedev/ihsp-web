"use client"

import { useT } from "@ihsp/i18n"
import { PageHeader, Icons, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { AsideCard, HeadingIcon, SplitLayout } from "../../../components/lib/split-layout"
import { UnderlineTabs, type UnderlineTab } from "../../../components/lib/underline-tabs"
import { ScrollFade } from "../../../components/scroll-fade"
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
    <ScrollFade maxHeight="70vh">
      <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {items.map((request) => (
          <HelpRequestCard key={request.id} request={request} />
        ))}
      </ul>
    </ScrollFade>
  )
}

function MyRequests() {
  const t = useT("help")
  const mine = useMyHelpRequests()
  return (
    <section aria-label={t("board.mine")} className="flex flex-col gap-3">
      <div className="flex justify-end">
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

function countOf(items: HelpRequest[] | undefined, delivered: boolean) {
  return (items ?? []).filter((request) => (request.status === "delivered") === delivered).length
}

export function HelpPage() {
  const t = useT("help")
  const mine = useMyHelpRequests()
  const assigned = useAssignedRequests()
  const assignedItems = assigned.data?.items ?? []
  const [tab, setTab] = useState("mine")
  const tabs: UnderlineTab[] = [
    { value: "mine", label: t("board.mine"), count: mine.data?.items.length, tone: "primary" },
    ...(assignedItems.length > 0
      ? [{ value: "assigned", label: t("board.assigned"), count: assignedItems.length, tone: "warning" as const }]
      : []),
    { value: "links", label: t("board.links"), tone: "neutral" },
  ]
  const active = tabs.some((item) => item.value === tab) ? tab : "mine"
  const all = [...(mine.data?.items ?? []), ...assignedItems]
  return (
    <AdmissionShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
        <PageHeader title={t("board.title")} back={<HeadingIcon name="help" />} />
        <SplitLayout
          aside={
            <>
              <AsideCard title={t("view.summaryTitle")} icon={<Icons.inbox aria-hidden className="size-4" />}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-warning/10 flex flex-col rounded-lg p-3">
                    <span className="text-lg font-semibold tabular-nums">{countOf(all, false)}</span>
                    <span className="text-muted-foreground text-xs">{t("view.open")}</span>
                  </div>
                  <div className="bg-success/10 flex flex-col rounded-lg p-3">
                    <span className="text-lg font-semibold tabular-nums">{countOf(all, true)}</span>
                    <span className="text-muted-foreground text-xs">{t("view.delivered")}</span>
                  </div>
                </div>
              </AsideCard>
              <AsideCard title={t("view.howTitle")} icon={<Icons.info aria-hidden className="size-4" />}>
                <p className="text-muted-foreground text-sm">{t("view.howText")}</p>
              </AsideCard>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <UnderlineTabs label={t("view.tabs")} value={active} onValueChange={setTab} tabs={tabs} />
            {active === "mine" ? <MyRequests /> : null}
            {active === "assigned" ? <RequestList items={assignedItems} emptyText={t("board.assignedEmpty")} /> : null}
            {active === "links" ? <GuestLinkManager /> : null}
          </div>
        </SplitLayout>
      </div>
    </AdmissionShell>
  )
}
