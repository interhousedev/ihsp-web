import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { apiUrl, ids, problem, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { EditorFrame } from "../features/editor/components/editor-frame"
import { renderLms } from "./helpers"

// The first render of a page in a cold test run takes several seconds.
setDefaultTimeout(60_000)

const courseId = ids.course

function renderFrame() {
  return renderLms(
    <EditorFrame courseId={courseId} current="outline" title="Course">
      {() => <p>Course tools</p>}
    </EditorFrame>,
    { route: `/edit/?id=${courseId}` },
  )
}

describe("editor frame: a failed permission load is an error, not access denied (UF-LMS-02)", () => {
  it("shows an error with a retry action when the staff list cannot be loaded", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:courseId/staff"), () => problem(500, "common/internal", "Internal error")),
    )
    renderFrame()

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
    expect(screen.queryByText("Course tools")).not.toBeInTheDocument()
  })

  it("shows access denied when the server refuses the staff list", async () => {
    server.use(http.get(apiUrl("/v1/lms/courses/:courseId/staff"), () => HttpResponse.json({}, { status: 403 })))
    renderFrame()

    expect(await screen.findByText(/access/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument()
  })
})
