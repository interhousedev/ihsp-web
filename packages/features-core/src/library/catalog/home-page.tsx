"use client"

import {
  getLibraryCollectionsQuery,
  getLibraryItemsQuery,
  getLibrarySubjectsQuery,
  getMeLibraryQuery,
  getReadingListsQuery,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, PageContainer, Skeleton, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useLibraryAccess } from "../hooks/use-library-access"
import { useVisibleCards } from "../hooks/use-uni-library"
import { ReadingListCardView } from "../lists/view/reading-list-card"
import { browseHref, collectionHref, listsHref } from "../utils/hrefs"
import { ContinueRow } from "./continue-row"
import { CoverImage } from "./cover-image"
import { ItemGrid } from "./item-grid"
import { SignInLink } from "./sign-in-link"

function SectionTitle({ id, children, href, more }: { id: string; children: string; href?: string; more?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-lg font-semibold">
        {children}
      </h2>
      {href && more ? (
        <Link
          href={href}
          className="text-primary min-h-11 content-center text-sm underline-offset-4 hover:underline md:min-h-8"
        >
          {more}
        </Link>
      ) : null}
    </div>
  )
}

function SearchBox() {
  const t = useT("library.home")
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState("")

  // "/" focuses the search field, like on most documentation sites (not while typing in another field).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return
      event.preventDefault()
      input.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <form
      role="search"
      aria-label={t("searchLabel")}
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        router.push(browseHref({ q: q.trim() }))
      }}
    >
      <Input
        ref={input}
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder={t("search")}
        aria-label={t("searchLabel")}
        className="min-h-11 flex-1 text-base md:min-h-9"
      />
      <Button type="submit" className="min-h-11 md:min-h-9">
        <Icons.search aria-hidden />
        <span className="sr-only sm:not-sr-only">{t("searchButton")}</span>
      </Button>
    </form>
  )
}

/**
 * The home page: search, Continue reading (3, signed in), Reading for your year (reading lists, signed in), subject
 * shelves with counts, collections and the recently added items. A signed-out visitor sees the public items and a
 * Sign in prompt. Sections that fail to load are left out; the page never shows a dead end.
 */
export function LibraryHomePage() {
  const t = useT("library.home")
  const { signedIn, status } = useLibraryAccess()
  const me = useQuery({ ...getMeLibraryQuery(), enabled: signedIn })
  const lists = useQuery({ ...getReadingListsQuery({ status: "published" }), enabled: signedIn })
  const subjects = useQuery(getLibrarySubjectsQuery())
  const collections = useQuery(getLibraryCollectionsQuery())
  const recent = useQuery(getLibraryItemsQuery({ sort: "newest", limit: 12 }))
  const recentCards = useVisibleCards(recent.data?.items)
  const continueCards = useVisibleCards(me.data?.continue).slice(0, 3)

  return (
    <PageContainer title={t("title")}>
      <SearchBox />

      {status === "anonymous" ? (
        <section
          aria-labelledby="home-signin-title"
          className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
        >
          <div>
            <h2 id="home-signin-title" className="font-semibold">
              {t("signInTitle")}
            </h2>
            <p className="text-muted-foreground text-sm">{t("signInText")}</p>
          </div>
          <SignInLink variant="default" />
        </section>
      ) : null}

      <ContinueRow items={continueCards} />

      {signedIn && lists.data && lists.data.length > 0 ? (
        <section aria-labelledby="home-lists-title" className="flex flex-col gap-3">
          <SectionTitle id="home-lists-title" href={listsHref()} more={t("seeAll")}>
            {t("forYourYear")}
          </SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lists.data.slice(0, 3).map((list) => (
              <li key={list.id}>
                <ReadingListCardView list={list} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {subjects.data && subjects.data.length > 0 ? (
        <section aria-labelledby="home-subjects-title" className="flex flex-col gap-3">
          <SectionTitle id="home-subjects-title">{t("subjects")}</SectionTitle>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {subjects.data.map((subject) => (
              <li key={subject.id}>
                <Link
                  href={browseHref({ subject: subject.id })}
                  className="bg-card hover:bg-muted/50 focus-visible:ring-ring flex min-h-20 flex-col justify-between gap-1 rounded-xl border p-3 focus-visible:ring-2"
                >
                  <span className="font-medium break-words">{subject.name}</span>
                  <span className="text-muted-foreground text-xs">{t("items", { count: subject.item_count })}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {collections.data && collections.data.length > 0 ? (
        <section aria-labelledby="home-collections-title" className="flex flex-col gap-3">
          <SectionTitle id="home-collections-title">{t("collections")}</SectionTitle>
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            {collections.data.map((collection) => (
              <li key={collection.id} className="w-44 shrink-0 snap-start">
                <Link
                  href={collectionHref(collection.id)}
                  className="bg-card hover:bg-muted/50 focus-visible:ring-ring flex h-full flex-col gap-2 rounded-xl border p-3 focus-visible:ring-2"
                >
                  <CoverImage src={collection.cover_url} className="aspect-[4/3] w-full rounded-md" />
                  <span className="line-clamp-2 text-sm font-medium break-words">{collection.title}</span>
                  <span className="text-muted-foreground text-xs">{t("items", { count: collection.item_count })}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="home-recent-title" className="flex flex-col gap-3">
        <SectionTitle id="home-recent-title" href={browseHref()} more={t("seeAll")}>
          {t("recent")}
        </SectionTitle>
        {recent.isPending ? (
          <div role="status" aria-busy="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : recent.isError ? (
          <StateView state="error" error={recent.error} onRetry={() => void recent.refetch()} />
        ) : recentCards.length === 0 ? (
          <StateView
            state="empty"
            emptyText={t("empty")}
            action={
              <Link href={browseHref()} className="text-primary text-sm underline-offset-4 hover:underline">
                {t("emptyAction")}
              </Link>
            }
          />
        ) : (
          <ItemGrid items={recentCards} label={t("recent")} />
        )}
      </section>
    </PageContainer>
  )
}
