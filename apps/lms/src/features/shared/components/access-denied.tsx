"use client"

import { useT } from "@ihsp/i18n"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Icons } from "@ihsp/ui"
import { LinkButton } from "./link-button"

/** Shown when the user lacks the permission a page needs (editor pages check `my_permissions`). */
export function AccessDenied({ backHref }: { backHref?: string }) {
  const t = useT("common")
  return (
    <div className="px-4 pt-4 md:px-6">
      <Empty className="border" role="alert">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icons.lock aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{t("noAccessTitle")}</EmptyTitle>
          <EmptyDescription>{t("noAccessDescription")}</EmptyDescription>
        </EmptyHeader>
        {backHref ? (
          <EmptyContent>
            <LinkButton href={backHref} variant="outline" className="min-h-11 md:min-h-8">
              {t("back")}
            </LinkButton>
          </EmptyContent>
        ) : null}
      </Empty>
    </div>
  )
}
