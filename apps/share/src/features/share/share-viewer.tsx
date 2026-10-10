"use client"

import { getPublicShareQuery, isApiError, type PublicShare } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { ArtifactView } from "./artifact-view"
import { ChatView } from "./chat-view"
import { FlashcardsView } from "./flashcards-view"
import { ReportForm } from "./report-form"
import { ShareFrame } from "./share-header"
import { ShareGone, ShareLoading, ShareNotFound } from "./share-states"
import { useShareSlug } from "./use-share-slug"

function ShareContent({ share, slug }: { share: PublicShare; slug: string }) {
  const t = useT("share")
  const f = useFormatters()
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight break-words">{share.title}</h1>
        <p className="text-muted-foreground text-sm">
          {t("sharedBy", { name: share.author_first_name })} ·{" "}
          {f.date(share.created_at, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
      {share.kind === "chat" && share.chat ? (
        <ChatView messages={share.chat.messages} authorName={share.author_first_name} />
      ) : null}
      {share.kind === "flashcard_set" && share.flashcards ? (
        <FlashcardsView cards={share.flashcards.cards} slug={slug} />
      ) : null}
      {share.kind === "artifact" && share.artifact ? <ArtifactView share={share} slug={slug} /> : null}
      <footer className="mt-auto flex flex-col gap-2 border-t pt-4">
        <ReportForm slug={slug} />
      </footer>
    </>
  )
}

/**
 * The public viewer (SHR-1 to SHR-8): reads the slug from the path, fetches the share without login and shows the chat or
 * the flash card set. `404` is "Link not found", `410` is "This link was removed".
 */
export function ShareViewer() {
  const slug = useShareSlug()
  const query = useQuery({
    ...getPublicShareQuery(slug ?? ""),
    enabled: Boolean(slug),
    retry: false,
  })

  if (slug === undefined) {
    return (
      <ShareFrame>
        <ShareLoading />
      </ShareFrame>
    )
  }
  if (slug === null) {
    return (
      <ShareFrame>
        <ShareNotFound />
      </ShareFrame>
    )
  }
  const status = isApiError(query.error) ? query.error.status : 0
  return (
    <ShareFrame>
      {query.isPending ? (
        <ShareLoading />
      ) : status === 404 ? (
        <ShareNotFound />
      ) : status === 410 ? (
        <ShareGone />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <ShareContent share={query.data} slug={slug} />
      )}
    </ShareFrame>
  )
}
