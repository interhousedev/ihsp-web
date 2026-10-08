"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import { useCopyFlashcardSet } from "../hooks/use-flashcards"

/** `/flashcards/copy/?share=`: copies a shared set with fresh progress after login, then opens it (SHR-5). */
export function CopySharedSet() {
  const t = useT("flashcards.copy")
  const router = useRouter()
  const slug = useSearchParams().get("share")
  const copy = useCopyFlashcardSet()
  const started = useRef(false)
  const { mutate } = copy

  // One request per visit, also under React strict mode.
  useEffect(() => {
    if (!slug || started.current) return
    started.current = true
    mutate(slug, {
      onSuccess: (set) => router.replace(`/flashcards/set/?id=${encodeURIComponent(set.id)}`),
    })
  }, [slug, mutate, router])

  function retry() {
    if (slug)
      copy.mutate(slug, { onSuccess: (set) => router.replace(`/flashcards/set/?id=${encodeURIComponent(set.id)}`) })
  }

  return (
    <PageContainer title={t("title")}>
      {!slug ? <StateView state="empty" emptyText={t("missing")} /> : null}
      {slug && copy.isError ? <StateView state="error" error={copy.error} onRetry={retry} /> : null}
      {slug && !copy.isError ? (
        <>
          <p className="text-muted-foreground text-sm">{t("copying")}</p>
          <StateView state="loading" rows={1} />
        </>
      ) : null}
    </PageContainer>
  )
}
