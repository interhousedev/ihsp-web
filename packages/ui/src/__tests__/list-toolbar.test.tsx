import { describe, expect, it, mock } from "bun:test"
import { fireEvent, screen } from "@testing-library/react"
import { renderWithProviders } from "@ihsp/test-utils"
import { ListToolbar, type ToolbarFilter } from "../components/list-toolbar"
import { SubjectFilter } from "../components/subject-filter"

const FILTERS: readonly ToolbarFilter[] = [
  { kind: "search", key: "q", label: "Search", debounceMs: 0 },
  {
    kind: "select",
    key: "group",
    label: "Group",
    allLabel: "All groups",
    options: [{ value: "g1", label: "1TN1" }],
  },
]

describe("ListToolbar", () => {
  it("shows no chips and no reset without active filters", () => {
    renderWithProviders(<ListToolbar filters={FILTERS} values={{}} onChange={() => {}} onReset={() => {}} />)
    expect(screen.queryByRole("button", { name: "Reset" })).toBeNull()
    expect(screen.queryByRole("button", { name: /^Clear:/ })).toBeNull()
  })

  it("shows the option label in a chip that removes that filter", () => {
    const onChange = mock((_key: string, _value: string | null) => {})
    renderWithProviders(<ListToolbar filters={FILTERS} values={{ group: "g1" }} onChange={onChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Clear: Group: 1TN1" }))
    expect(onChange).toHaveBeenCalledWith("group", null)
  })

  it("resets all filters", () => {
    const onReset = mock(() => {})
    renderWithProviders(<ListToolbar filters={FILTERS} values={{ q: "abc" }} onChange={() => {}} onReset={onReset} />)
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it("passes search text immediately with no debounce and treats blank as no filter", () => {
    const onChange = mock((_key: string, _value: string | null) => {})
    renderWithProviders(<ListToolbar filters={FILTERS} values={{}} onChange={onChange} />)
    fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), { target: { value: "oʻzbek" } })
    expect(onChange).toHaveBeenLastCalledWith("q", "oʻzbek")
    fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), { target: { value: "  " } })
    expect(onChange).toHaveBeenLastCalledWith("q", null)
  })

  it("draws a segment as pressed buttons whose all value clears the filter, without a chip", () => {
    const onChange = mock((_key: string, _value: string | null) => {})
    renderWithProviders(
      <ListToolbar
        filters={[
          {
            kind: "segment",
            key: "kind",
            label: "Kind",
            allValue: "all",
            options: [
              { value: "all", label: "All" },
              { value: "file", label: "File" },
            ],
          },
        ]}
        values={{ kind: "file" }}
        onChange={onChange}
      />,
    )
    expect(screen.getByRole("button", { name: "File" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByRole("button", { name: /^Clear:/ })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "All" }))
    expect(onChange).toHaveBeenCalledWith("kind", null)
  })

  it("lists extra chips for filters drawn elsewhere and counts them as active", () => {
    const onRemove = mock(() => {})
    renderWithProviders(
      <ListToolbar
        filters={[]}
        values={{}}
        onChange={() => {}}
        onReset={() => {}}
        extraChips={[{ key: "tag", label: "Tag: math", onRemove }]}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Clear: Tag: math" }))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy()
  })
})

describe("SubjectFilter", () => {
  const subjects = [
    { id: "a", name: "Math" },
    { id: "b", name: "Physics" },
  ]

  it("renders nothing with fewer than two subjects", () => {
    const { container } = renderWithProviders(
      <SubjectFilter subjects={subjects.slice(0, 1)} value={null} onChange={() => {}} label="Subject" allLabel="All" />,
    )
    expect(container.textContent).toBe("")
  })

  it("is labelled and shows the chosen subject", () => {
    renderWithProviders(
      <SubjectFilter subjects={subjects} value="b" onChange={() => {}} label="Subject" allLabel="All" />,
    )
    expect(screen.getByRole("combobox", { name: "Subject" })).toHaveAttribute("data-value", "b")
  })
})
