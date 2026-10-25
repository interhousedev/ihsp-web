"use client"

import { getAdminBroadcast, keys } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { QueryState } from "../../shared/components/query-state"
import { BroadcastEditor } from "./broadcast-editor"

/** `/broadcasts/edit/` starts a new draft; `?id=` opens an existing broadcast. */
export function BroadcastEditorPage() {
  const [id] = useQueryState("id", parseAsString)
  const query = useQuery({
    queryKey: keys.admin.broadcasts.detail(id ?? ""),
    queryFn: ({ signal }) => getAdminBroadcast(id ?? "", { signal }),
    enabled: id !== null,
  })
  if (id === null) return <BroadcastEditor key="new" item={null} />
  return (
    <QueryState query={query} rows={4}>
      {(item) => <BroadcastEditor key={`${item.id}-${item.status}`} item={item} />}
    </QueryState>
  )
}
