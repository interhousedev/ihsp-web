"use client"

import { keys, postJoinNotebook } from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { JoinSharePage } from "./join-page"

/** `/notebooks/join/#token`: gets a grant, then opens the notebook. */
export function NotebookJoinPage() {
  const client = useQueryClient()
  const join = useCallback(
    async (token: string) => {
      const notebook = await postJoinNotebook(token)
      await client.invalidateQueries({ queryKey: keys.sharing.notebooks() })
      return `/notebooks/view/?id=${encodeURIComponent(notebook.id)}`
    },
    [client],
  )
  return <JoinSharePage join={join} />
}
