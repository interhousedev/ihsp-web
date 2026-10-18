import { describe, expect, it } from "bun:test"
import { renderWithProviders, selectDropdownOption } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { useState } from "react"
import { Dropdown } from "../components/ui/dropdown"

const options = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana", disabled: true },
  { value: "c", label: "Cherry" },
  { value: "d", label: "Date" },
]

function Controlled({ multiple = false }: { multiple?: boolean }) {
  const [single, setSingle] = useState("")
  const [many, setMany] = useState<string[]>([])
  return multiple ? (
    <Dropdown
      aria-label="Fruits"
      name="fruits"
      multiple
      options={options}
      value={many}
      onValueChange={setMany}
      placeholder="Pick fruits"
    />
  ) : (
    <Dropdown
      aria-label="Fruit"
      name="fruit"
      options={options}
      value={single}
      onValueChange={setSingle}
      placeholder="Pick one"
    />
  )
}

describe("Dropdown", () => {
  it("shows the placeholder, then the chosen label, and posts the value as a form field", async () => {
    const { user, container } = renderWithProviders(<Controlled />)
    const trigger = screen.getByRole("combobox", { name: "Fruit" })
    expect(trigger).toHaveTextContent("Pick one")
    await selectDropdownOption(user, trigger, "Cherry")
    expect(trigger).toHaveTextContent("Cherry")
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(container.querySelector<HTMLInputElement>("input[name=fruit]")?.value).toBe("c")
  })

  it("supports arrow keys, Home/End, Enter and Escape", async () => {
    const { user } = renderWithProviders(<Controlled />)
    const trigger = screen.getByRole("combobox", { name: "Fruit" })
    trigger.focus()
    await user.keyboard("{ArrowDown}")
    const listbox = screen.getByRole("listbox")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    await user.keyboard("{ArrowDown}")
    // Banana is disabled, so the second step lands on Cherry.
    expect(trigger).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Cherry" }).id)
    await user.keyboard("{End}")
    expect(trigger).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Date" }).id)
    await user.keyboard("{Home}")
    await user.keyboard("{Enter}")
    expect(trigger).toHaveTextContent("Apple")
    expect(listbox).not.toBeInTheDocument()

    await user.keyboard("{ArrowDown}{Escape}")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(trigger).toHaveFocus()
  })

  it("type-ahead moves to the matching option", async () => {
    const { user } = renderWithProviders(<Controlled />)
    const trigger = screen.getByRole("combobox", { name: "Fruit" })
    trigger.focus()
    await user.keyboard("{ArrowDown}")
    await user.keyboard("d")
    expect(trigger).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Date" }).id)
  })

  it("does not choose disabled options", async () => {
    const { user } = renderWithProviders(<Controlled />)
    const trigger = screen.getByRole("combobox", { name: "Fruit" })
    await user.click(trigger)
    await user.click(screen.getByRole("option", { name: "Banana" }))
    expect(trigger).toHaveTextContent("Pick one")
    expect(screen.getByRole("listbox")).toBeInTheDocument()
  })

  it("multi-select keeps the list open and posts one field per value", async () => {
    const { user, container } = renderWithProviders(<Controlled multiple />)
    const trigger = screen.getByRole("combobox", { name: "Fruits" })
    await selectDropdownOption(user, trigger, "Apple")
    await selectDropdownOption(user, trigger, "Date")
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true")
    expect(trigger).toHaveTextContent("Apple, Date")
    const values = Array.from(container.querySelectorAll<HTMLInputElement>("input[name=fruits]")).map((i) => i.value)
    expect(values).toEqual(["a", "d"])
  })

  it("filters options when searchable", async () => {
    const { user } = renderWithProviders(
      <Dropdown aria-label="Search fruit" searchable options={options} defaultValue="" searchPlaceholder="Find" />,
    )
    const trigger = screen.getByRole("combobox", { name: "Search fruit" })
    await user.click(trigger)
    await user.type(screen.getByRole("combobox", { name: "Find" }), "che")
    expect(screen.queryByRole("option", { name: "Apple" })).toBeNull()
    await user.click(screen.getByRole("option", { name: "Cherry" }))
    expect(trigger).toHaveTextContent("Cherry")
  })
})
