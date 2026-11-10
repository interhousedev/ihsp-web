"use client"

import { getAppMapQuery, type AppMapItem } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { useLocale, useT } from "@ihsp/i18n"
import { isMiniApp } from "@ihsp/telegram/core"
import { Button, Icons, Input, Skeleton } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { lazy, Suspense, useState } from "react"
import { leaveMiniApp } from "../platform-links"
import { isInternalHref } from "../shell/link-button"
import { appMapTitle, filterAppMap, quickLinks } from "./app-map-search"

const HelpChat = lazy(() => import("./help-chat"))

const ROW = "hover:bg-muted flex min-h-11 items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm"

/** The app id of this build as the app map names it (`OAUTH_CLIENT_ID`; the installed `sp` is `app`). */
function currentApp(): string {
  const client = getConfig().OAUTH_CLIENT_ID
  return client === "app" ? "sp" : client
}

function MapLink({ item, locale, current }: { item: AppMapItem; locale: string; current: boolean }) {
  const t = useT("helpWidget")
  const title = appMapTitle(item, locale)
  if (item.url === null) {
    return (
      <span className={`${ROW} text-muted-foreground`}>
        <Icons.chat aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 truncate">
          {title} <span className="text-xs">{t("botCommand", { path: item.path })}</span>
        </span>
      </span>
    )
  }
  if (current && isInternalHref(item.path)) {
    return (
      <Link href={item.path} className={ROW}>
        <Icons.arrowRight aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 truncate">{title}</span>
      </Link>
    )
  }
  return (
    <a href={item.url} onClick={leaveMiniAppWhenInside(item.url)} className={ROW}>
      <Icons.externalLink aria-hidden className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{title}</span>
    </a>
  )
}

/** Cross-app links leave the Telegram webview through the SDK; elsewhere they are plain links. */
function leaveMiniAppWhenInside(href: string) {
  return isMiniApp() ? leaveMiniApp(href) : undefined
}

function MapStage({ onAsk }: { onAsk: (seed: string) => void }) {
  const t = useT("helpWidget")
  const locale = useLocale()
  const map = useQuery(getAppMapQuery())
  const [query, setQuery] = useState("")
  const app = currentApp()
  const items = map.data?.items ?? []
  const term = query.trim()
  const shown = term ? filterAppMap(items, term, locale) : quickLinks(items, app)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      <div className="relative">
        <Icons.search aria-hidden className="text-muted-foreground pointer-events-none absolute start-3 top-3 size-4" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          className="min-h-11 ps-9 md:min-h-8"
        />
      </div>
      {map.isPending ? (
        <div role="status" aria-label={t("loading")} className="flex flex-col gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : null}
      {map.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2 text-sm">
          <p>{t("error")}</p>
          <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => void map.refetch()}>
            {t("retry")}
          </Button>
        </div>
      ) : null}
      {map.isSuccess && shown.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3 className="text-muted-foreground px-2 text-xs font-medium">{term ? t("results") : t("quick")}</h3>
          <ul>
            {shown.map((item) => (
              <li key={item.id}>
                <MapLink item={item} locale={locale} current={item.app === app} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {map.isSuccess && term && shown.length === 0 ? (
        <p className="text-muted-foreground px-2 text-sm">{t("empty", { query: term })}</p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="mt-auto min-h-11 justify-start md:min-h-8"
        onClick={() => onAsk(term)}
      >
        <Icons.assistant aria-hidden />
        <span className="min-w-0 truncate">{term ? t("askAbout", { query: term }) : t("askAssistant")}</span>
      </Button>
    </div>
  )
}

/**
 * The floating help blob of the app shells: a button in the bottom corner that opens a compact card with a search over
 * the map of pages (`GET /v1/app-map`) and, on demand, the assistant chat. It stays above the mobile bottom nav and the
 * safe area, and is not shown on the assistant page itself.
 */
export function HelpWidget() {
  const t = useT("helpWidget")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [chatSeed, setChatSeed] = useState<string | null>(null)

  if (pathname.startsWith("/assistant")) return null

  const close = () => {
    setOpen(false)
    setChatSeed(null)
  }

  return (
    <div
      className="fixed end-4 z-40 flex flex-col items-end gap-2 bottom-[calc(var(--bottom-nav-height,0px)+var(--safe-bottom,0px)+1rem)] md:bottom-4"
      data-help-widget
    >
      {open ? (
        <section
          role="dialog"
          aria-label={t("title")}
          className="bg-popover text-popover-foreground rounded-card flex h-[min(32rem,calc(100dvh-10rem))] w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 border p-3 shadow-lg"
        >
          <header className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{chatSeed === null ? t("title") : t("chatTitle")}</h2>
            <Button type="button" variant="ghost" size="icon" className="size-11 md:size-8" onClick={close}>
              <Icons.close aria-hidden />
              <span className="sr-only">{t("close")}</span>
            </Button>
          </header>
          {chatSeed === null ? (
            <MapStage onAsk={setChatSeed} />
          ) : (
            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
              <HelpChat seed={chatSeed} onBack={() => setChatSeed(null)} />
            </Suspense>
          )}
        </section>
      ) : null}
      <Button
        type="button"
        size="icon"
        className="size-12 rounded-full shadow-lg"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <Icons.close aria-hidden /> : <Icons.assistant aria-hidden />}
        <span className="sr-only">{open ? t("close") : t("open")}</span>
      </Button>
    </div>
  )
}
