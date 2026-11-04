import { describe, expect, it, setDefaultTimeout, spyOn } from "bun:test"
import { apiUrl, ids, problem, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { GroupPicker } from "../features/settings/components/group-picker"
import { StepPlayer } from "../features/player/components/step-player"
import { renderLms } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

describe("group picker: a failed group list is shown, not an empty list (CRS-SET)", () => {
  it("shows the error when the groups cannot be loaded", async () => {
    server.use(http.get(apiUrl("/v1/staff/groups"), () => problem(500, "common/internal", "Internal error")))
    renderLms(<GroupPicker value={[]} onChange={() => undefined} />)

    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })
})

describe("step player: a failed progress mark is reported to the learner (UF-LMS-04)", () => {
  it("shows an error toast when the step cannot be marked as viewed", async () => {
    const error = spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.post(apiUrl("/v1/lms/steps/:stepId/viewed"), () => problem(500, "common/internal", "Internal error")),
    )
    renderLms(
      <StepPlayer courseId={ids.course} stepId={ids.courseStepTest} slug="derivatives-101" block={null} mode="learn" />,
      { route: `/course/${ids.course}/step/${ids.courseStepTest}/` },
    )

    await waitFor(() => expect(error).toHaveBeenCalled())
    error.mockRestore()
  })
})
