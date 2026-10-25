"use client"

import type { LinkItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { CopyLinkButton } from "@ihsp/features-core"
import { Badge, Button, Card, CardContent } from "@ihsp/ui"
import { IconBan, IconTrash } from "@ihsp/ui"
import Link from "next/link"
import { canDelete, canRevoke, linkName, linkStatus } from "../utils/link-display"

type LinkRowProps = {
  link: LinkItem
  onRevoke: (link: LinkItem) => void
  onDelete: (link: LinkItem) => void
}

/** One link or share: kind, name, short URL, hits, dates, status and actions (WEB-26). */
export function LinkRow({ link, onRevoke, onDelete }: LinkRowProps) {
  const t = useT("links.row")
  const format = useFormatters()
  const status = linkStatus(link)
  const kindLabel = link.lesson_id ? t("kind.lesson") : t(`kind.${link.kind}`)

  return (
    <Card data-link-id={link.id}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{kindLabel}</Badge>
          {status !== "active" ? <Badge variant="destructive">{t(`status.${status}`)}</Badge> : null}
          {link.kind === "chat" && link.share_mode ? (
            <Badge variant="outline">{link.share_mode === "live" ? t("modeLive") : t("modeSnapshot")}</Badge>
          ) : null}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-medium break-words">{linkName(link)}</h3>
          {link.kind === "url" && link.target_url ? (
            <p className="text-muted-foreground text-xs break-all">{link.target_url}</p>
          ) : null}
        </div>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm break-all underline-offset-2 hover:underline"
        >
          {link.url}
        </a>
        <p className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
          <span>{t("hits", { count: link.hits })}</span>
          <span>{t("created", { date: format.date(link.created_at) })}</span>
          {link.expires_at ? <span>{t("expires", { date: format.date(link.expires_at) })}</span> : null}
        </p>
        <div className="flex flex-wrap gap-2">
          <CopyLinkButton value={link.url} label={t("copy")} />
          {link.kind === "artifact" ? (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:bg-muted inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium"
            >
              {t("open")}
            </a>
          ) : null}
          {canRevoke(link) ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              aria-label={t("revokeLabel", { name: linkName(link) })}
              onClick={() => onRevoke(link)}
            >
              <IconBan aria-hidden />
              {t("revoke")}
            </Button>
          ) : null}
          {canDelete(link) ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              aria-label={t("deleteLabel", { name: linkName(link) })}
              onClick={() => onDelete(link)}
            >
              <IconTrash aria-hidden />
              {t("delete")}
            </Button>
          ) : null}
          {link.lesson_id ? (
            <Link
              href={`/lessons/view/?id=${encodeURIComponent(link.lesson_id)}`}
              className="hover:bg-muted inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium"
            >
              {t("openLesson")}
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
