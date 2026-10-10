"use client"

import { getLibraryItemQuery, isApiError, type ItemDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Skeleton, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useLibraryAccess } from "../hooks/use-library-access"
import { useUniLibraryAvailability } from "../hooks/use-uni-library"
import { listHref } from "../utils/hrefs"
import { AccessChip } from "./access-chip"
import { CoverImage } from "./cover-image"
import { ExternalActions } from "./external-actions"
import { ImportanceBadge } from "./importance-badge"
import { ItemActions, primaryFile } from "./item-actions"
import { ItemContents } from "./item-contents"
import { ItemDetails } from "./item-details"
import { ItemOwnerPanel } from "./item-owner-panel"
import { NotAvailable } from "./not-available"
import { SourceTag } from "./source-tag"

const EXTERNAL_DESCRIPTION_MAX = 600

function Header({ item }: { item: ItemDetail }) {
  const t = useT("library")
  const material = item.material
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <CoverImage src={item.cover_url} className="aspect-[3/4] w-40 shrink-0 self-center rounded-lg sm:self-start" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SourceTag source={item.tag.source} />
          <span className="text-muted-foreground text-sm">
            {t(`type.${item.type}`)}
            {item.year_published ? ` · ${item.year_published}` : ""}
          </span>
          {item.external ? <AccessChip access={item.external.access} /> : null}
        </div>
        <h1 className="text-2xl font-bold tracking-tight break-words md:text-3xl">{item.title}</h1>
        {item.subtitle ? <p className="text-muted-foreground text-base">{item.subtitle}</p> : null}
        {item.author_label ? <p className="text-sm">{item.author_label}</p> : null}
        {material ? (
          <p className="text-muted-foreground text-sm">
            {material.uploader_role === "student"
              ? t("item.uploadedBy", { name: material.uploader_name, cohort: material.uploader_cohort })
              : t("item.uploadedByTeacher", { name: material.uploader_name })}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function ReadingLists({ item }: { item: ItemDetail }) {
  const t = useT("library.item")
  const { signedIn } = useLibraryAccess()
  if (!signedIn || item.lists.length === 0) return null
  return (
    <section aria-labelledby="item-lists-title" className="flex flex-col gap-2">
      <h2 id="item-lists-title" className="text-base font-semibold">
        {t("inLists")}
      </h2>
      <ul className="flex flex-col gap-1">
        {item.lists.map((list) => (
          <li key={list.id}>
            <Link
              href={listHref(list.id)}
              className="hover:bg-muted flex min-h-11 items-center justify-between gap-3 rounded-md px-2 text-sm md:min-h-9"
            >
              <span className="min-w-0 break-words">{list.title}</span>
              <ImportanceBadge importance={list.importance} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Topics({ item }: { item: ItemDetail }) {
  const t = useT("library")
  if (item.topics.length === 0) return null
  return (
    <section aria-labelledby="item-topics-title" className="flex flex-col gap-2">
      <h2 id="item-topics-title" className="text-base font-semibold">
        {t("item.topics")}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {item.topics.map((topic) => (
          <li key={topic.id}>
            <Badge variant="secondary" className="font-normal">
              {topic.name}
              {topic.page_from
                ? ` · ${t("readingList.pages", { from: topic.page_from, to: topic.page_to ?? topic.page_from })}`
                : ""}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Variant for a UniLibrary record: metadata and one way out, **Open on UniLibrary**. Link-only, by design. */
function ExternalView({ item }: { item: ItemDetail }) {
  const t = useT("library.unilibrary")
  const description = item.description?.slice(0, EXTERNAL_DESCRIPTION_MAX)
  const external = item.external
  return (
    <>
      <Header item={item} />
      {external?.gone ? (
        <p role="status" className="rounded-md border px-3 py-2 text-sm">
          {t("gone")}
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">{t("howTo")}</p>
      )}
      <ExternalActions item={item} />
      <p className="text-muted-foreground text-xs">{t("universityLevel")}</p>
      {description ? (
        <section aria-labelledby="item-description-title" className="flex flex-col gap-1">
          <h2 id="item-description-title" className="text-base font-semibold">
            {t("description")}
          </h2>
          <p className="text-sm whitespace-pre-line">{description}</p>
        </section>
      ) : null}
      {external ? (
        <dl className="grid grid-cols-[8rem_1fr] gap-x-2 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">{t("field")}</dt>
          <dd>{external.field_name}</dd>
          <dt className="text-muted-foreground">{t("type")}</dt>
          <dd>{external.type_name}</dd>
          {item.external_keywords && item.external_keywords.length > 0 ? (
            <>
              <dt className="text-muted-foreground">{t("keywords")}</dt>
              <dd>{item.external_keywords.join(", ")}</dd>
            </>
          ) : null}
        </dl>
      ) : null}
      <ItemDetails item={item} />
    </>
  )
}

/** Variant for a book or a material: actions, owner box, notices, description, contents, topics, rights and facts. */
function StoredView({ item }: { item: ItemDetail }) {
  const t = useT("library.item")
  const file = primaryFile(item)
  const unavailable = item.status === "unpublished" || item.status === "held" || item.status === "gone"
  return (
    <>
      <Header item={item} />
      {unavailable ? (
        <div role="status" className="rounded-md border px-3 py-2 text-sm">
          <p className="font-medium">{t("removed")}</p>
          <p className="text-muted-foreground">{t("removedHint")}</p>
        </div>
      ) : null}
      <ItemActions item={item} />
      <ItemOwnerPanel item={item} />
      {file?.text_status === "no_text" ? (
        <p role="note" className="text-muted-foreground text-sm">
          {t("noText")}
        </p>
      ) : null}
      {item.description ? <p className="text-sm whitespace-pre-line">{item.description}</p> : null}
      {file && item.id && item.can.read ? <ItemContents itemId={item.id} file={file} /> : null}
      <Topics item={item} />
      <ReadingLists item={item} />
      <ItemDetails item={item} />
    </>
  )
}

/** The item page for a loaded detail, in its three variants (UniLibrary, book, material). */
export function ItemView({ item }: { item: ItemDetail }) {
  const availability = useUniLibraryAvailability()
  if (item.kind === "external") {
    if (availability === "loading") return <StateView state="loading" />
    // UniLibrary is dormant: while the API has not confirmed it is on, a UniLibrary record does not exist for the UI.
    if (availability === "disabled") return <NotAvailable />
    return <ExternalView item={item} />
  }
  return <StoredView item={item} />
}

/** The `/item/?id=` page body: loads the item and shows it, or "This item is not available". */
export function ItemPage() {
  const params = useSearchParams()
  const id = params.get("id")
  const { status } = useLibraryAccess()
  // Not before the silent restore ends: an early request goes out without the token, gets a visitor's 404 (logged in
  // the console) and is repeated once the session is known.
  const query = useQuery({
    ...getLibraryItemQuery(id ?? ""),
    enabled: Boolean(id) && status !== "loading",
    retry: false,
  })
  if (!id) return <NotAvailable />
  const hidden = query.isError && isApiError(query.error) && (query.error.status === 404 || query.error.status === 403)
  // While the session is still being restored a hidden answer may be only the visitor's view: do not flash "sign in".
  if (query.isPending || (hidden && status === "loading")) {
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-4 px-4 pt-4 md:px-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }
  if (query.isError) {
    if (isApiError(query.error) && (query.error.status === 404 || query.error.status === 403)) return <NotAvailable />
    return (
      <div className="px-4 pt-4 md:px-6">
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      </div>
    )
  }
  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-4 pb-8 md:px-6">
      <ItemView item={query.data} />
    </article>
  )
}
