"use client"

import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, Skeleton, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { QueryError } from "../../shell/components/query-error"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { NODE_STATUSES, pick, useMarkNode, useTrajectory, type NodeOut, type NodeStatus } from "../api"
import { Roadmap, RoadmapLegend } from "./roadmap"

/** The node drawer: description, resources, prerequisites and the progress buttons. */
export function NodeDrawer({
  node,
  before,
  status,
  canTrack,
  busy,
  onMark,
  onClose,
}: {
  node: NodeOut | null
  before: NodeOut[]
  status: NodeStatus | undefined
  canTrack: boolean
  busy: boolean
  onMark: (status: NodeStatus | null) => void
  onClose: () => void
}) {
  const t = useT("trajectories")
  const lang = useLocale()
  return (
    <Sheet open={node !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-4 sm:max-w-md">
        {node && (
          <>
            <SheetHeader className="p-0">
              <SheetTitle>{pick(node.title, lang)}</SheetTitle>
              <SheetDescription>
                {t(`kind.${node.kind}`)} · {t(`level.${node.level}`)}
                {node.optional ? ` · ${t("optional")}` : ""}
              </SheetDescription>
            </SheetHeader>
            {pick(node.description, lang) && (
              <p className="text-sm whitespace-pre-line">{pick(node.description, lang)}</p>
            )}
            {before.length > 0 && (
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">{t("before")}</h3>
                <ul className="text-muted-foreground list-disc pl-5 text-sm">
                  {before.map((b) => (
                    <li key={b.id}>{pick(b.title, lang)}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">{t("resources")}</h3>
              {node.resources.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("noResources")}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {node.resources.map((r) => (
                    <li key={`${r.kind}:${r.ref}`}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:border-primary flex min-h-11 flex-col rounded-md border px-3 py-2 text-sm"
                      >
                        <span className="text-muted-foreground text-xs">{t(`resourceKind.${r.kind}`)}</span>
                        <span className="text-primary underline">{r.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {canTrack && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">{t("myProgress")}</h3>
                <div className="flex flex-wrap gap-2">
                  {NODE_STATUSES.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      size="sm"
                      className="min-h-11"
                      variant={status === s ? "default" : "outline"}
                      aria-pressed={status === s}
                      disabled={busy}
                      onClick={() => onMark(status === s ? null : s)}
                    >
                      {t(`mark.${s}`)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function TrajectoryBody() {
  const t = useT("trajectories")
  const lang = useLocale()
  const errorMessage = useErrorMessage()
  const slug = useSearchParams().get("slug") ?? ""
  const query = useTrajectory(slug)
  const mark = useMarkNode(slug)
  const [open, setOpen] = useState<string | null>(null)
  const data = query.data
  const progress = useMemo(
    () => Object.fromEntries((data?.progress ?? []).map((p) => [p.node_id, p.status])) as Record<string, NodeStatus>,
    [data],
  )
  const nodes = useMemo(() => (data?.trajectory.stages ?? []).flatMap((s) => s.nodes), [data])
  const node = nodes.find((n) => n.id === open) ?? null
  const before = node
    ? nodes.filter((n) => data?.trajectory.edges.some((e) => e.after === node.id && e.before === n.id))
    : []
  const back = (
    <Link href="/trajectories/" className="text-primary text-sm underline">
      {t("back")}
    </Link>
  )

  if (!slug) return <StateView state="empty" title={t("notFound")} />
  if (query.isPending) return <Skeleton className="m-4 h-64" />
  if (query.isError) return <QueryError error={query.error} onRetry={() => void query.refetch()} />
  const tr = data?.trajectory
  if (!tr) return null
  const required = nodes.filter((n) => !n.optional)
  const done = required.filter((n) => progress[n.id] === "done").length

  return (
    <div className={pageClass()}>
      {back}
      <AppPageHeader
        icon="route"
        title={pick(tr.title, lang)}
        meta={
          <>
            {t(`field.${tr.field}`)}
            {data.can_track ? ` · ${t("progressLabel", { done, total: required.length })}` : ""}
          </>
        }
      />
      {pick(tr.description, lang) && <p className="text-muted-foreground text-sm">{pick(tr.description, lang)}</p>}
      <RoadmapLegend />
      <div className="overflow-x-auto">
        <Roadmap stages={tr.stages} edges={tr.edges} progress={progress} selected={open} onSelect={setOpen} />
      </div>
      <NodeDrawer
        node={node}
        before={before}
        status={node ? progress[node.id] : undefined}
        canTrack={data.can_track}
        busy={mark.isPending}
        onClose={() => setOpen(null)}
        onMark={(status) =>
          node &&
          mark.mutate(
            { trajectoryId: tr.id, nodeId: node.id, status },
            { onError: (e) => toast.error(errorMessage(e)) },
          )
        }
      />
    </div>
  )
}

export function TrajectoryPage() {
  return (
    <AdmissionShell>
      <TrajectoryBody />
    </AdmissionShell>
  )
}
