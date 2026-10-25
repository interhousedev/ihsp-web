"use client"

import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription } from "@ihsp/ui"
import { useState } from "react"
import { useBotPostTree, useReorderBotPosts } from "../hooks/use-bot-posts"
import { botPostErrorMessage } from "../utils/errors"
import { findNode } from "../utils/tree"
import { PostEditor } from "./post-editor"
import { PostTree } from "./post-tree"

export function BotPostsPage() {
  const t = useT("botPosts")
  const query = useBotPostTree()
  const reorder = useReorderBotPosts()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (query.isPending) return <p className="text-muted-foreground text-sm">{t("loading")}</p>
  if (query.isError || !query.data) return <p className="text-destructive text-sm">{t("loadFailed")}</p>

  const root = query.data
  const selected = (selectedId ? findNode(root, selectedId) : null) ?? root

  return (
    <div className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{t("tree.title")}</h2>
        {reorder.error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {t(botPostErrorMessage(reorder.error).key, botPostErrorMessage(reorder.error).values)}
            </AlertDescription>
          </Alert>
        ) : null}
        <PostTree
          root={root}
          selectedId={selected.id}
          onSelect={setSelectedId}
          onReorder={(parentId, ids) => reorder.mutate({ parentId, ids })}
        />
      </aside>
      <section className="min-w-0">
        <PostEditor key={selected.id} post={selected} root={root} onSelect={setSelectedId} />
      </section>
    </div>
  )
}
