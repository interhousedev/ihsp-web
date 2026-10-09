"use client"

import { getReadingListQuery, isApiError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Icons,
  PageContainer,
  StateView,
  buttonVariants,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { NotAvailable } from "../../catalog/not-available"
import { listHref, listsHref } from "../../utils/hrefs"
import { ListEditorForm } from "./list-editor-form"

/**
 * `/lists/edit/?id=`: a new reading list (no `id`) or the editor of an existing one. The page is for teachers,
 * librarians and administrators; a list the caller may read but not change shows a short notice, and an unknown id
 * is "This item is not available".
 */
export function ReadingListEditor() {
  const t = useT("library.listEditor")
  const id = useSearchParams().get("id")
  const query = useQuery({ ...getReadingListQuery(id ?? ""), enabled: Boolean(id), retry: false })

  if (!id) {
    return (
      <PageContainer title={t("newTitle")} description={t("description")}>
        <ListEditorForm key="new" />
      </PageContainer>
    )
  }
  if (query.isPending) {
    return (
      <div className="px-4 pt-4 md:px-6">
        <StateView state="loading" />
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
  if (!query.data.can_edit) {
    return (
      <PageContainer title={t("editTitle")}>
        <Empty className="border" role="status">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icons.lock aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{t("readOnlyTitle")}</EmptyTitle>
            <EmptyDescription>{t("readOnlyText", { title: query.data.title })}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row flex-wrap justify-center gap-2">
            <Link href={listHref(id)} className={buttonVariants({ className: "min-h-11 md:min-h-8" })}>
              {t("openList")}
            </Link>
            <Link
              href={listsHref()}
              className={buttonVariants({ variant: "outline", className: "min-h-11 md:min-h-8" })}
            >
              {t("allLists")}
            </Link>
          </EmptyContent>
        </Empty>
      </PageContainer>
    )
  }
  return (
    <PageContainer title={t("editTitle")} description={query.data.title}>
      <ListEditorForm key={query.data.id} list={query.data} />
    </PageContainer>
  )
}
