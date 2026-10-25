"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, cn } from "@ihsp/ui"
import { IconArchive, IconArchiveOff, IconChevronDown, IconChevronUp, IconPencil, IconPlus, IconTrash } from "@ihsp/ui"
import { pickLocalized } from "../shared/localized-fields"
import type { TopicNode } from "./topic-tree"

/** One topic of the tree with its move, edit, add-child, archive and delete buttons; its children are nested below. */
export function TopicTreeNode({
  node,
  first,
  last,
  busy,
  onAdd,
  onEdit,
  onDelete,
  onMove,
  onArchive,
}: {
  node: TopicNode
  first: boolean
  last: boolean
  busy: boolean
  onAdd: (node: TopicNode) => void
  onEdit: (node: TopicNode) => void
  onDelete: (node: TopicNode) => void
  onMove: (node: TopicNode, direction: -1 | 1) => void
  onArchive: (node: TopicNode) => void
}) {
  const t = useT("library.manage.topics")
  const browse = useT("library.browse")
  const { locale } = useFormatters()
  const name = pickLocalized(node.name, locale)
  return (
    <li className="flex flex-col gap-2">
      <div
        className={cn("flex flex-wrap items-center gap-2 rounded-lg border p-2 ps-3", node.archived && "opacity-70")}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium break-words">{name}</span>
          {node.code ? <Badge variant="outline">{node.code}</Badge> : null}
          <span className="text-muted-foreground text-xs">{node.slug}</span>
          {node.year_of_study ? <Badge variant="outline">{browse("year", { year: node.year_of_study })}</Badge> : null}
          {node.archived ? <Badge variant="secondary">{t("archived")}</Badge> : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            disabled={busy || first}
            aria-label={t("moveUp", { name })}
            onClick={() => onMove(node, -1)}
          >
            <IconChevronUp aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            disabled={busy || last}
            aria-label={t("moveDown", { name })}
            onClick={() => onMove(node, 1)}
          >
            <IconChevronDown aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            aria-label={t("addChild", { name })}
            onClick={() => onAdd(node)}
          >
            <IconPlus aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            aria-label={t("edit", { name })}
            onClick={() => onEdit(node)}
          >
            <IconPencil aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            disabled={busy}
            aria-label={node.archived ? t("restore", { name }) : t("archive", { name })}
            onClick={() => onArchive(node)}
          >
            {node.archived ? <IconArchiveOff aria-hidden /> : <IconArchive aria-hidden />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive size-11 md:size-8"
            aria-label={t("delete", { name })}
            onClick={() => onDelete(node)}
          >
            <IconTrash aria-hidden />
          </Button>
        </div>
      </div>
      {node.children.length > 0 ? (
        <ul className="border-border ms-3 flex flex-col gap-2 border-s ps-3 md:ms-5">
          {node.children.map((child, index) => (
            <TopicTreeNode
              key={child.id}
              node={child}
              first={index === 0}
              last={index === node.children.length - 1}
              busy={busy}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onArchive={onArchive}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
