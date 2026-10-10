"use client"

import type { AddSourcesResult, DiscoverResult, SourceInput } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useState } from "react"
import { useAddSources, useSources } from "../api"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { MAX_ADD_ITEMS, SOURCE_LIMIT } from "./constants"

type Rejected = AddSourcesResult["rejected"][number]["error"]

/**
 * The choice of pages in the Discover results and the one `POST …/sources` that adds them as `url` sources.
 * Pages are told apart by their URL. Refused pages keep their message on their row; added ones turn into
 * "Already in sources" and `add` resolves to `true` when every chosen page went through.
 */
/** The source to create for a result: a `db` result goes in by reference, anything else as a `url`. */
export function sourceFor(result: DiscoverResult): SourceInput {
  if (result.origin === "db" && result.ref_kind === "library_item" && result.ref_id) {
    return { kind: "library_item", item_id: result.ref_id }
  }
  if (result.origin === "db") return { kind: "text", title: result.title, text: result.snippet }
  return { kind: "url", url: result.url, title: result.title }
}

export function useDiscoverAdd(notebookId: string, results: readonly DiscoverResult[]) {
  const t = useT("notebooks")
  const sources = useSources(notebookId)
  const adder = useAddSources(notebookId)
  const errorMessage = useNotebookErrorMessage()
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  const [added, setAdded] = useState<ReadonlySet<string>>(new Set())
  const [refusals, setRefusals] = useState<ReadonlyMap<string, string>>(new Map())
  const [error, setError] = useState<string | null>(null)

  const capacity = Math.max(0, Math.min(MAX_ADD_ITEMS, SOURCE_LIMIT - (sources.data?.length ?? 0)))
  const isTaken = (result: DiscoverResult) => result.already_added || added.has(result.url)
  const available = results.filter((result) => !isTaken(result))
  const pickable = Math.min(capacity, available.length)
  const allPicked = pickable > 0 && picked.size >= pickable
  const atLimit = available.length > picked.size && picked.size >= capacity

  function toggle(url: string) {
    setPicked((current) => {
      const next = new Set(current)
      if (next.has(url)) next.delete(url)
      else if (next.size < capacity) next.add(url)
      return next
    })
  }

  function toggleAll() {
    setPicked(allPicked ? new Set() : new Set(available.slice(0, capacity).map((result) => result.url)))
  }

  function refusalText(rejected: Rejected): string {
    const blocked = rejected.type === "notebooks/source-unsupported" && rejected.params.hint === "blocked"
    return blocked ? t("discover.blocked") : errorMessage(rejected)
  }

  async function add(): Promise<boolean> {
    const chosen = available.filter((result) => picked.has(result.url))
    setError(null)
    setRefusals(new Map())
    try {
      const outcome = await adder.mutateAsync(
        chosen.map(sourceFor),
      )
      const refused = new Map(
        outcome.rejected.flatMap((entry) => {
          const result = chosen[entry.index]
          return result ? [[result.url, refusalText(entry.error)] as const] : []
        }),
      )
      setRefusals(refused)
      setAdded((current) => new Set([...current, ...chosen.map((r) => r.url).filter((url) => !refused.has(url))]))
      setPicked(new Set())
      return refused.size === 0
    } catch (failure) {
      setError(errorMessage(failure))
      return false
    }
  }

  return {
    picked,
    capacity,
    isTaken,
    refusals,
    error,
    pending: adder.isPending,
    allPicked,
    atLimit,
    canPickAny: pickable > 0,
    toggle,
    toggleAll,
    add,
  }
}
