"use client"

import { api, isApiError, seg, type RequestOptions } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import { chatLibrary, MessageWithOpenUi } from "@ihsp/features-core/openui"
import { Button, Markdown, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { toast } from "sonner"
import { ShareGone, ShareLoading, ShareNotFound } from "./share-states"

/** A bot answer with OpenUI blocks, shared by its link (`m-` slug). Local type: the route is not in the generated client yet. */
export type PublicVisualization = { text: string; created_at: string; expires_at: string }

/** GET /v1/public/visualizations/{slug} — none; `404` unknown or revoked, `410` expired, `429` rate limited. */
export function getPublicVisualization(slug: string, opts?: RequestOptions): Promise<PublicVisualization> {
  return api.get<PublicVisualization>(`/v1/public/visualizations/${seg(slug)}`, { ...opts, auth: "none" })
}

/** Slugs of shared bot answers start with `m-`. */
export function isVisualizationSlug(slug: string): boolean {
  return slug.startsWith("m-")
}

/** Shares the page: the system sheet when there is one, else the address goes to the clipboard and a toast says so. */
export async function sharePage(title: string, messages: { copied: string; failed: string }): Promise<void> {
  const url = window.location.href
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ url, title })
    } catch {
      // The visitor closed the sheet: nothing to report.
    }
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    toast.success(messages.copied)
  } catch {
    toast.error(messages.failed)
  }
}

/** Light theme only on this page, even when the system or an earlier visit chose dark. */
function useForceLight() {
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      if (root.classList.contains("dark")) root.classList.remove("dark")
      root.style.colorScheme = "light"
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(root, { attributes: true, attributeFilter: ["class", "style"] })
    return () => observer.disconnect()
  }, [])
}

/** The public page of one shared bot answer: logo, a white card with the text and its OpenUI blocks, a share button. */
export function VisualizationView({ slug }: { slug: string }) {
  const t = useT("share.visualization")
  useForceLight()
  const query = useQuery({
    queryKey: ["public", "visualizations", slug],
    queryFn: ({ signal }) => getPublicVisualization(slug, { signal }),
    retry: false,
  })
  useEffect(() => {
    document.title = t("title")
  }, [t])
  const status = isApiError(query.error) ? query.error.status : 0

  return (
    <div className="light min-h-dvh bg-white text-neutral-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-3 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-4">
        <a href={getConfig().SP_URL} aria-label={t("openApp")}>
          {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the logo is a plain file of /public */}
          <img src="/ai/icons/logo.svg" alt={t("logoAlt")} width={32} height={32} className="size-8" />
        </a>
        <main id="main-content" className="flex w-full min-w-0 flex-col gap-4">
          {query.isPending ? (
            <ShareLoading />
          ) : status === 404 ? (
            <ShareNotFound />
          ) : status === 410 ? (
            <ShareGone title={t("expiredTitle")} description={t("expiredDescription")} />
          ) : query.isError ? (
            <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <>
              <article className="w-full max-w-full min-w-0 overflow-x-hidden rounded-2xl border border-neutral-200 bg-white p-3 text-sm break-words shadow-sm sm:p-5">
                <MessageWithOpenUi
                  text={query.data.text}
                  library={chatLibrary}
                  renderMarkdown={(part) => <Markdown>{part}</Markdown>}
                />
              </article>
              <Button
                variant="outline"
                className="min-h-11 self-center"
                onClick={() => void sharePage(t("title"), { copied: t("copied"), failed: t("copyFailed") })}
              >
                {t("share")}
              </Button>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
