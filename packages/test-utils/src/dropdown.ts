import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"

/**
 * Opens the `Dropdown` behind `trigger` (its combobox) and clicks the option whose name matches `option`.
 * A multi-select list stays open after a pick, so an already open list is not toggled shut.
 */
export async function selectDropdownOption(user: UserEvent, trigger: HTMLElement, option: string | RegExp) {
  if (trigger.getAttribute("aria-expanded") !== "true") {
    await user.click(trigger)
  }
  const listboxId = trigger.getAttribute("aria-controls")
  let listbox: HTMLElement | null = null
  await waitFor(() => {
    listbox = listboxId ? document.getElementById(listboxId) : null
    if (!listbox) throw new Error("dropdown list is not open")
  })
  await user.click(within(listbox as unknown as HTMLElement).getByRole("option", { name: option }))
  return screen
}

/** Like `selectDropdownOption`, but picks the option whose `value` is `value` (the old `selectOptions` argument). */
export async function selectDropdownValue(user: UserEvent, trigger: HTMLElement, value: string) {
  if (trigger.getAttribute("aria-haspopup") !== "listbox") {
    await user.selectOptions(trigger, value)
    return
  }
  if (trigger.getAttribute("aria-expanded") !== "true") {
    await user.click(trigger)
  }
  let option: HTMLElement | null = null
  await waitFor(() => {
    option = findOptionByValueOrLabel(trigger, value)
    if (!option) throw new Error(`no dropdown option with value "${value}"`)
  })
  await user.click(option as unknown as HTMLElement)
}

/**
 * Synchronous variant for `fireEvent`-based tests: opens the `Dropdown` behind `trigger` and clicks the option whose
 * `value` is `value`. Use it where a test used to `fireEvent.change` a native select.
 */
export function setDropdownValue(trigger: HTMLElement, value: string) {
  // Anything that is not a Dropdown trigger (an input, or a remaining native select) gets a plain change event.
  if (trigger.getAttribute("aria-haspopup") !== "listbox") {
    fireEvent.change(trigger, { target: { value } })
    return
  }
  if (trigger.getAttribute("aria-expanded") !== "true") fireEvent.click(trigger)
  const option = findOptionByValueOrLabel(trigger, value)
  if (!option) throw new Error(`no dropdown option with value "${value}"`)
  fireEvent.click(option)
}

/** The option whose value is `value`, or else whose label is `value` (a native select matched either). */
function findOptionByValueOrLabel(trigger: HTMLElement, value: string): HTMLElement | null {
  const listboxId = trigger.getAttribute("aria-controls")
  const listbox = listboxId ? document.getElementById(listboxId) : null
  if (!listbox) return null
  const options = [...listbox.querySelectorAll<HTMLElement>("[role='option']")]
  return (
    options.find((option) => option.dataset.value === value) ??
    options.find((option) => option.textContent === value) ??
    null
  )
}

/** The labels of the options a `Dropdown` lists when opened (opens it when closed; the list stays open). */
export async function dropdownLabels(user: UserEvent, trigger: HTMLElement): Promise<string[]> {
  if (trigger.getAttribute("aria-expanded") !== "true") {
    await user.click(trigger)
  }
  const listboxId = trigger.getAttribute("aria-controls")
  const listbox = listboxId ? document.getElementById(listboxId) : null
  if (!listbox) throw new Error("dropdown list is not open")
  return within(listbox)
    .getAllByRole("option")
    .map((option) => option.textContent ?? "")
}
