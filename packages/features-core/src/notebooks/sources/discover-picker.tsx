"use client"

import type { DiscoverResult } from "@ihsp/api"
import { DiscoverFooter } from "./discover-footer"
import { DiscoverResultRow } from "./discover-result-row"
import { useDiscoverAdd } from "./use-discover-add"

type DiscoverPickerProps = {
  notebookId: string
  results: readonly DiscoverResult[]
  /** Every chosen page was added: close the results. */
  onDone: () => void
}

/** The found pages with their checkboxes and the footer that adds the ticked ones. */
export function DiscoverPicker({ notebookId, results, onDone }: DiscoverPickerProps) {
  const choice = useDiscoverAdd(notebookId, results)

  async function add() {
    if (await choice.add()) onDone()
  }

  return (
    <>
      <ul className="flex flex-col gap-1.5">
        {results.map((result) => (
          <DiscoverResultRow
            key={result.url}
            result={result}
            checked={choice.picked.has(result.url)}
            taken={choice.isTaken(result)}
            full={choice.picked.size >= choice.capacity}
            refusal={choice.refusals.get(result.url)}
            onToggle={() => choice.toggle(result.url)}
          />
        ))}
      </ul>
      <DiscoverFooter
        count={choice.picked.size}
        allPicked={choice.allPicked}
        canPickAny={choice.canPickAny}
        atLimit={choice.atLimit}
        capacity={choice.capacity}
        pending={choice.pending}
        error={choice.error}
        onToggleAll={choice.toggleAll}
        onAdd={() => void add()}
      />
    </>
  )
}
