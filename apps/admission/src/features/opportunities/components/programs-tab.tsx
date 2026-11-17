"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Pill, ResponsiveDialog, Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { AsideCard, SplitLayout } from "../../../components/lib/split-layout"
import { ScrollFade } from "../../../components/scroll-fade"
import { usePlan, usePrograms, useRemoveFromPlan, useSaveToPlan, type ProgramItem } from "../api"

const PAGE_SIZE = 10

/** The program's logo, or its monogram when it has none or the image fails. */
function Logo({ item }: { item: ProgramItem }) {
  return (
    <LogoAvatar
      name={item.org?.name ?? item.fields.title}
      src={item.org?.logo_url ?? item.fields.logo_url}
      fit="contain"
      className="size-12 shrink-0 ring-0"
    />
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-16 flex-col items-center text-center">
      <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

function useStats(item: ProgramItem) {
  const t = useT("opportunities")
  return statsOf(item, t("programs.free"))
}

function statsOf(item: ProgramItem, free: string) {
  const f = item.fields
  return {
    rank: f.ranking ? `#${f.ranking}` : "—",
    accept: f.acceptance_rate != null ? `~${f.acceptance_rate}%` : "—",
    tuition: f.tuition_usd == null ? "—" : f.tuition_usd === 0 ? free : `$${f.tuition_usd.toLocaleString("en-US")}`,
  }
}

function Details({ item, onClose }: { item: ProgramItem; onClose: () => void }) {
  const t = useT("opportunities")
  const f = item.fields
  const s = useStats(item)
  return (
    <ResponsiveDialog open onOpenChange={(o) => !o && onClose()} title={f.title}>
      <div className="flex flex-col gap-3 text-sm">
        {f.summary && (
          <div className="flex flex-col gap-1">
            <p lang="en">{f.summary}</p>
            <span className="text-muted-foreground text-xs">{t("sourceLanguage")}</span>
          </div>
        )}
        <div className="flex gap-4">
          <Stat label={t("programs.rank")} value={s.rank} />
          <Stat label={t("programs.accept")} value={s.accept} />
          <Stat label={t("programs.tuition")} value={s.tuition} />
        </div>
        {f.host_institution && <span>{f.host_institution}</span>}
        {f.duration_weeks ? <span>{t("programs.weeks", { count: f.duration_weeks })}</span> : null}
        {item.upcoming.map((d) => (
          <span key={`${d.kind}-${d.day}`} className="flex items-center gap-2">
            <Icons.calendarEvent aria-hidden className="size-4" />
            {t(`dateKind.${d.kind}`)}: {formatDate(d.day)}
            {d.projected && <span className="text-muted-foreground text-xs">{t("expected")}</span>}
          </span>
        ))}
        {f.url && (
          <a
            className="text-primary inline-flex min-h-11 items-center underline md:min-h-9"
            href={f.url}
            target="_blank"
            rel="noreferrer"
          >
            {t("officialSite")}
          </a>
        )}
      </div>
    </ResponsiveDialog>
  )
}

/** The Programs tab: a searchable, paged list of summer and pre-college programs. */
export function ProgramsBody() {
  const t = useT("opportunities")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<ProgramItem | null>(null)
  const list = usePrograms({ q: q || undefined, page, size: PAGE_SIZE })
  const plan = usePlan()
  const save = useSaveToPlan()
  const remove = useRemoveFromPlan()
  const saved = new Set(plan.data?.entries.map((e) => e.opportunity_id))
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.size)) : 1
  const busy = save.isPending || remove.isPending

  return (
    <SplitLayout
      aside={
        <AsideCard title={t("view.programsTitle")} icon={<Icons.search aria-hidden className="size-4" />}>
          <Input
            aria-label={t("programs.search")}
            placeholder={t("programs.search")}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Pill tone="primary">{t("view.programsTotal", { count: list.data?.total ?? 0 })}</Pill>
            <Pill tone="success">{t("view.programsSaved", { count: saved.size })}</Pill>
          </div>
          <Link href="/opportunities/plan/" className="text-primary text-sm underline-offset-2 hover:underline">
            {t("myPlan")}
          </Link>
        </AsideCard>
      }
    >
      <div className="flex flex-col gap-4">
        {list.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : list.isError ? (
          <StateView state="error" onRetry={() => void list.refetch()} />
        ) : list.data.items.length === 0 ? (
          <StateView state="empty" icon={<Icons.search aria-hidden />} title={t("programs.empty")} />
        ) : (
          <ScrollFade maxHeight="70vh">
            <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {list.data.items.map((item) => {
                const s = statsOf(item, t("programs.free"))
                const f = item.fields
                const isSaved = saved.has(item.id)
                const place = [f.country, f.online ? t("programs.online") : f.location].filter(Boolean).join(" · ")
                return (
                  <li
                    key={item.id}
                    className="bg-card rounded-card flex min-w-0 flex-col gap-3 border p-3 md:flex-row md:items-center"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => setOpen(item)}
                    >
                      <Logo item={item} />
                      <span className="flex min-w-0 flex-col">
                        <span className="font-medium break-words">{f.title}</span>
                        {place && (
                          <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Icons.pin aria-hidden className="size-3 shrink-0" />
                            <span className="min-w-0 break-words">{place}</span>
                          </span>
                        )}
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap gap-3">
                        <Stat label={t("programs.rank")} value={s.rank} />
                        <Stat label={t("programs.accept")} value={s.accept} />
                        <Stat label={t("programs.tuition")} value={s.tuition} />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="min-h-11 shrink-0 md:min-h-9"
                        variant={isSaved ? "outline" : "default"}
                        disabled={busy}
                        onClick={() =>
                          isSaved
                            ? remove.mutate(item.id)
                            : save.mutate(
                                { id: item.id, planned_grade: f.grades?.[0] ?? null },
                                { onSuccess: () => toast.success(t("saved")) },
                              )
                        }
                      >
                        {isSaved ? t("programs.added") : t("programs.add")}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </ScrollFade>
        )}
        {list.data && list.data.total > list.data.size && (
          <nav aria-label={t("programs.pagination")} className="flex items-center justify-center gap-3">
            <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              {t("programs.previous")}
            </Button>
            <span className="text-sm">{t("programs.pageOf", { page, pages })}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
            >
              {t("programs.next")}
            </Button>
          </nav>
        )}
        {open && <Details item={open} onClose={() => setOpen(null)} />}
      </div>
    </SplitLayout>
  )
}
