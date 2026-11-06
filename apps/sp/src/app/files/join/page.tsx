"use client"

import { keys, postJoinFile } from "@ihsp/api"
import { JoinSharePage } from "@ihsp/features-core"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  const client = useQueryClient()
  const join = useCallback(
    async (token: string) => {
      await postJoinFile(token)
      await client.invalidateQueries({ queryKey: keys.sharing.files() })
      return "/files/"
    },
    [client],
  )
  return (
    <SpShell>
      <JoinSharePage join={join} />
    </SpShell>
  )
}
