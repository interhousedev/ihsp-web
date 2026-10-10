"use client"

import type { ItemCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Progress, ProgressIndicator, ProgressTrack, cn } from "@ihsp/ui"
import { IconExternalLink } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { itemHref } from "../utils/hrefs"
import { AccessChip } from "./access-chip"
import { cardRouteId } from "./card-utils"
import { CoverImage } from "./cover-image"
import { SourceTag } from "./source-tag"

/** "Uploaded by Aziza K., 2025" for students, the teacher's name alone otherwise. */
function UploadedBy({ material }: { material: NonNullable<ItemCard["material"]> }) {
  const t = useT("library.item")
  const text =
    material.uploader_role === "student"
      ? t("uploadedBy", { name: material.uploader_name, cohort: material.uploader_cohort })
      : t("uploadedByTeacher", { name: material.uploader_name })
  return <p className="text-muted-foreground truncate text-xs">{text}</p>
}

/**
 * A catalogue card: cover, source tag, type and year, title, author label, the kind-specific line (rights badge,
 * access chip, "Uploaded by …"), reading progress and, for full-text hits, the snippet with its page. The title is the
 * link to the item page (a stretched link, so the whole card is clickable while the actions in `footer` stay usable).
 * A UniLibrary card always carries **Open on UniLibrary** and links to its own page only when it has an id.
 */
export function ItemCardView({
  item,
  layout = "grid",
  footer,
  className,
}: {
  item: ItemCard
  layout?: "grid" | "list"
  /** Extra actions or status under the text (for example a queue's buttons). */
  footer?: ReactNode
  className?: string
}) {
  const t = useT("library")
  const routeId = cardRouteId(item)
  const external = item.external
  const list = layout === "list"
  const title = routeId ? (
    <Link
      href={itemHref(routeId)}
      className="line-clamp-2 font-medium break-words after:absolute after:inset-0 hover:underline"
    >
      {item.title}
    </Link>
  ) : (
    <span className="line-clamp-2 font-medium break-words">{item.title}</span>
  )
  return (
    <article
      className={cn(
        "bg-card text-card-foreground focus-within:ring-ring relative flex gap-3 rounded-xl border p-3 transition-shadow focus-within:ring-2 hover:shadow-sm",
        list ? "flex-row items-start" : "flex-col",
        className,
      )}
    >
      <CoverImage
        src={item.cover_url}
        title={item.title}
        author={item.author_label}
        className={cn("shrink-0 rounded-md", list ? "h-28 w-20" : "aspect-[3/4] w-full max-h-64")}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <SourceTag source={item.tag.source} />
          <span className="text-muted-foreground text-xs">
            {t(`type.${item.type}`)}
            {item.year_published ? ` · ${item.year_published}` : ""}
          </span>
        </div>
        <h3 className="text-sm leading-snug">{title}</h3>
        {item.author_label ? <p className="text-muted-foreground line-clamp-1 text-xs">{item.author_label}</p> : null}
        {item.material ? <UploadedBy material={item.material} /> : null}
        {external ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <AccessChip access={external.access} />
            {external.gone ? <span className="text-muted-foreground text-xs">{t("unilibrary.gone")}</span> : null}
          </div>
        ) : null}
        {item.snippet ? (
          <p className="text-muted-foreground line-clamp-3 text-xs">
            …{item.snippet}…
            {item.snippet_page ? (
              <span className="ms-1 font-medium">({t("browse.page", { page: item.snippet_page })})</span>
            ) : null}
          </p>
        ) : null}
        {item.progress_percent !== null && item.progress_percent > 0 ? (
          <Progress value={item.progress_percent} aria-label={t("home.continue")}>
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
        ) : null}
        {external && !external.gone ? (
          <a
            href={external.view_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary relative z-10 mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium underline-offset-4 hover:underline md:min-h-8"
          >
            {t("unilibrary.open")}
            <IconExternalLink className="size-4" aria-hidden />
          </a>
        ) : null}
        {footer ? <div className="relative z-10 mt-1">{footer}</div> : null}
      </div>
    </article>
  )
}
