"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button } from "@ihsp/ui"
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"
import { pickLocalized } from "../shared/localized-fields"
import type { TopicNode } from "./topic-tree"

/** One topic of the tree with its edit, add-child and delete buttons; its children are nested below. */
export function TopicTreeNode({
  node,
  onAdd,
  onEdit,
  onDelete,
}: {
  node: TopicNode
  onAdd: (node: TopicNode) => void
  onEdit: (node: TopicNode) => void
  onDelete: (node: TopicNode) => void
}) {
  const t = useT("library.manage.topics")
  const browse = useT("library.browse")
  const { locale } = useFormatters()
  const name = pickLocalized(node.name, locale)
  return (
    <li className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2 ps-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium break-words">{name}</span>
          <span className="text-muted-foreground text-xs">{node.slug}</span>
          {node.year_of_study ? <Badge variant="outline">{browse("year", { year: node.year_of_study })}</Badge> : null}
        </div>
        <div className="flex shrink-0 gap-1">
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
          {node.children.map((child) => (
            <TopicTreeNode key={child.id} node={child} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
