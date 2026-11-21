"use client"

import { isApiError, type AdmissionListBrief } from "@ihsp/api"
import { useSession } from "@ihsp/auth"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, cn, Icons, Skeleton } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { consentKeys, putConsent } from "../../consent/api"
import { useEntryLabel, useList, useListBrief } from "../hooks"
import { AddToListButton } from "./add-to-list-button"
import { useOptionLabel } from "./option-label"

const DAY_MS = 24 * 60 * 60 * 1000
const storageKey = (userId: string) => `ihsp:uni-brief:${userId}`

type Cached = { brief: AdmissionListBrief; at: number; signature: string }

function readCache(userId: string): Cached | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    const value = raw ? (JSON.parse(raw) as Partial<Cached>) : null
    return value?.brief && typeof value.at === "number" && typeof value.signature === "string" ? (value as Cached) : null
  } catch {
    return null
  }
}

function writeCache(userId: string, cached: Cached) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(cached))
  } catch {
    // Storage full or blocked: the brief just is not kept.
  }
}

/**
 * Whether to ask the model for a new brief without the student asking: never for an empty list, always when nothing is
 * kept yet, otherwise only when the list changed since the kept brief and it is a day old. Manual refresh is separate.
 */
export function shouldAutoGenerate(cached: Pick<Cached, "at" | "signature"> | null, signature: string, entries: number, now: number): boolean {
  if (entries === 0) return false
  if (!cached) return true
  return cached.signature !== signature && now - cached.at >= DAY_MS
}

function BriefError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const t = useT("brief")
  const errorMessage = useErrorMessage()
  const client = useQueryClient()
  const grant = useMutation({
    mutationFn: () => putConsent(["admission_ai"]),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: consentKeys.consent() })
      onRetry()
    },
  })
  const type = isApiError(error) ? error.type : ""
  if (type === "admission/consent_required")
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{t("consent.title")}</p>
        <p className="text-muted-foreground text-sm">{t("consent.text")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" disabled={grant.isPending} onClick={() => grant.mutate()}>
            {t("consent.allow")}
          </Button>
          <Link href="/settings/#consent" className="text-primary inline-flex min-h-11 items-center text-sm underline">
            {t("consent.settings")}
          </Link>
        </div>
      </div>
    )
  return (
    <div role="alert" className="flex flex-col gap-2">
      <p className="text-sm font-medium">{type === "ai/limit-reached" ? t("limit.title") : t("error.title")}</p>
      <p className="text-muted-foreground text-sm">{type === "ai/limit-reached" ? t("limit.text") : errorMessage(error)}</p>
      {type === "ai/limit-reached" ? null : (
        <Button type="button" size="sm" variant="outline" className="self-start" onClick={onRetry}>
          {t("retry")}
        </Button>
      )}
    </div>
  )
}

function BriefBody({ brief }: { brief: AdmissionListBrief }) {
  const t = useT("uniList")
  const role = useOptionLabel("bucket")
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm leading-snug font-semibold">{brief.headline}</p>
        <p className="text-muted-foreground text-sm leading-snug">{brief.diagnosis}</p>
      </div>
      {brief.next_steps.length > 0 ? (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-muted-foreground text-xs font-medium">{t("brief.steps")}</h3>
          <ul className="flex flex-col gap-1.5">
            {brief.next_steps.map((step) => (
              <li key={step} className="flex items-start gap-2 text-sm leading-snug">
                <Icons.arrowRight aria-hidden className="text-primary mt-0.5 size-4 shrink-0" />
                {step}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {brief.suggestions.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-medium">{t("brief.suggestions")}</h3>
          <ul className="flex flex-col gap-2">
            {brief.suggestions.map((item) => (
              <li key={item.institution_id} className="bg-muted/50 flex flex-col gap-1 rounded-2xl p-3">
                <p className="text-sm font-semibold">
                  {item.name} <span className="text-muted-foreground font-normal">· {role(item.role)}</span>
                </p>
                <p className="text-muted-foreground text-xs leading-snug">{item.reason}</p>
                <AddToListButton institutionId={item.institution_id} className="pt-1" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

/**
 * The AI brief of the list, kept in this browser per user. It is generated again only when the list changed, and at
 * most once a day; a manual refresh always works. One instance serves the rail and the "AI overview" sheet.
 */
export function useBrief() {
  const locale = useLocale()
  const { session } = useSession()
  const userId = session?.user.id
  const list = useList()
  const labelOf = useEntryLabel()
  const generate = useListBrief()
  const [cached, setCached] = useState<Cached | null>(null)
  const [ready, setReady] = useState(false)
  const tried = useRef(false)

  const entries = list.data ?? []
  const signature = entries
    .map((entry) => `${entry.id}:${labelOf(entry) ?? ""}`)
    .sort()
    .join("|")

  useEffect(() => {
    if (!userId) return
    setCached(readCache(userId))
    setReady(true)
  }, [userId])

  function run() {
    if (!userId || generate.isPending) return
    generate.mutate(undefined, {
      onSuccess: (brief) => {
        const next = { brief, at: Date.now(), signature }
        writeCache(userId, next)
        setCached(next)
      },
    })
  }

  useEffect(() => {
    if (!ready || !userId || !list.data || tried.current) return
    tried.current = true
    if (shouldAutoGenerate(cached, signature, list.data.length, Date.now())) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per visit, after the cache and the list are known
  }, [ready, userId, list.data])

  const stale = cached !== null && cached.signature !== signature
  const written = cached
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" }).format(
        new Date(cached.at),
      )
    : null

  return { entries, generate, cached, stale, written, run }
}

export type BriefState = ReturnType<typeof useBrief>

/** The brief as a card (the right rail from `lg`) or, `embedded`, as the plain content of the "AI overview" sheet. */
export function BriefRail({ brief, embedded = false }: { brief: BriefState; embedded?: boolean }) {
  const t = useT("uniList")
  const { entries, generate, cached, stale, written, run } = brief
  return (
    <aside
      aria-label={t("brief.title")}
      className={cn("flex flex-col gap-4", embedded ? null : "bg-card rounded-3xl border p-4 max-lg:hidden lg:sticky lg:top-4")}
    >
      <header className={cn("flex items-center gap-2", embedded ? "justify-end" : "justify-between")}>
        <h2 className={cn("flex items-center gap-2 text-base font-semibold", embedded ? "sr-only" : null)}>
          <Icons.sparkles aria-hidden className="text-primary size-4" />
          {t("brief.title")}
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={generate.isPending || entries.length === 0}
          aria-label={t("brief.refresh")}
          onClick={run}
        >
          {t("brief.refresh")}
        </Button>
      </header>
      {generate.isPending ? (
        <div role="status" aria-busy="true" aria-label={t("brief.loading")} className="flex flex-col gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : generate.isError ? (
        <BriefError error={generate.error} onRetry={run} />
      ) : cached ? (
        <>
          <BriefBody brief={cached.brief} />
          <p className="text-muted-foreground text-xs">
            {t("brief.generated", { time: written ?? "" })}
            {stale ? ` · ${t("brief.stale")}` : ""}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">{entries.length === 0 ? t("brief.emptyList") : t("brief.none")}</p>
      )}
    </aside>
  )
}
