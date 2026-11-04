import { describe, expect, it } from "bun:test"
import { apiUrl, problem, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { http } from "msw"
import { renderLibrary } from "../test-support"
import { emptyValues } from "./material-values"
import { StepReview } from "./step-review"

describe("StepReview", () => {
  it("shows a retry instead of the subject ids when the subjects cannot be loaded, and the names after the retry", async () => {
    server.use(http.get(apiUrl("/v1/library/subjects"), () => problem(500, "common/internal", "Boom"), { once: true }))
    const values = { ...emptyValues("uz_latn"), kind: "markdown" as const, title: "Kinematics notes", body: "Newton" }

    const { user } = renderLibrary(
      <StepReview values={{ ...values, subjectIds: ["subject-physics"] }} canPublish={false} />,
    )

    const alert = await screen.findByRole("alert")
    expect(screen.queryByText("subject-physics")).not.toBeInTheDocument()
    await user.click(within(alert).getByRole("button", { name: "Try again" }))

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
  })
})
