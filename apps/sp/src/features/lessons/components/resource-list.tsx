"use client"

import type { ResourceItem } from "@ihsp/api"
import { AddToNotebookMenu, ResourceList as SharedResourceList } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, IconNotebook } from "@ihsp/ui"

/** Materials and attachments of a lesson (WEB-11): the shared list plus "Add to notebook", which only students have. */
export function ResourceList({
  items,
  currentUserId,
  onDelete,
}: {
  items: ResourceItem[]
  currentUserId?: string
  onDelete?: (item: ResourceItem) => void
}) {
  const tNotebook = useT("assistant.addToNotebook")
  return (
    <SharedResourceList
      items={items}
      {...(currentUserId ? { currentUserId } : {})}
      {...(onDelete ? { onDelete } : {})}
      renderActions={(item) =>
        item.hidden ? null : (
          <AddToNotebookMenu
            input={{ kind: "lesson_resource", lesson_id: item.lesson_id, link_id: item.link_id }}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 md:size-8"
                aria-label={tNotebook("itemLabel", { title: item.title })}
              >
                <IconNotebook aria-hidden />
              </Button>
            }
          />
        )
      }
    />
  )
}
