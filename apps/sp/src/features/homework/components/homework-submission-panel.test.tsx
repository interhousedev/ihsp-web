import { describe, expect, it } from "bun:test"
import { homeworkOverdue, renderWithProviders } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import en from "../../../../messages/en.json"
import { HomeworkPage } from "./homework-page"

const render = () => renderWithProviders(<HomeworkPage />, { messages: en, route: "/homework/" })

describe("homework submission", () => {
  it("hands in files with a comment, shows the status, then withdraws", async () => {
    const { user } = render()

    const card = (await screen.findByText(homeworkOverdue.text)).closest("li") as HTMLElement
    expect(within(card).queryByText("Handed in late")).not.toBeInTheDocument()

    await user.click(within(card).getByRole("button", { name: "Hand in" }))
    const send = within(card).getByRole("button", { name: "Send" })
    expect(send).toBeDisabled()
    await user.upload(
      within(card).getByLabelText("Upload files"),
      new File(["answers"], "answers.pdf", { type: "application/pdf" }),
    )
    await user.type(within(card).getByLabelText("Comment for the teacher (optional)"), "Done")
    await user.click(within(card).getByRole("button", { name: "Send" }))

    await waitFor(() => expect(within(card).getByText("Handed in late")).toBeInTheDocument())
    expect(within(card).getByText(/1 file/)).toBeInTheDocument()
    expect(within(card).getByRole("button", { name: "Replace" })).toBeInTheDocument()

    await user.click(within(card).getByRole("button", { name: "Withdraw" }))

    await waitFor(() => expect(within(card).queryByText("Handed in late")).not.toBeInTheDocument())
    expect(within(card).getByRole("button", { name: "Hand in" })).toBeInTheDocument()
  })
})
