import { describe, expect, it, setDefaultTimeout } from "bun:test"
import type { Block, FileCreateBody } from "@ihsp/api"
import { apiUrl, problem, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { http } from "msw"
import { useState } from "react"
import { VideoBlock } from "../features/player/components/video-block"
import { VideoBlockEditor } from "../features/step-editor/components/video-block-editor"
import { resumeAt, loadVideoPosition, saveVideoPosition } from "../features/shared/utils/video-position"
import { renderLms } from "./helpers"

setDefaultTimeout(60_000)

type Video = Extract<Block, { type: "video" }>
const empty: Video = {
  id: "v1",
  type: "video",
  source: "link",
  url: "",
  file_id: null,
  caption: "",
}

function Editor({ initial = empty }: { initial?: Video }) {
  const [block, setBlock] = useState<Video>(initial)
  return (
    <>
      <VideoBlockEditor block={block} onChange={setBlock} courseId="c1" stepId="s1" />
      <output data-testid="block">{JSON.stringify(block)}</output>
    </>
  )
}

const current = () => JSON.parse(screen.getByTestId("block").textContent ?? "{}") as Video

describe("video upload in the editor", () => {
  it("uploads the file as an lms_video and keeps its id instead of a link", async () => {
    let body: FileCreateBody | undefined
    server.use(
      http.post(apiUrl("/v1/files"), async ({ request }) => {
        body = (await request.clone().json()) as FileCreateBody
      }),
    )
    const { user } = renderLms(<Editor />)
    const file = new File([new Uint8Array(2048)], "lesson.mp4", {
      type: "video/mp4",
    })

    await user.upload(screen.getByLabelText("Video file (MP4, WebM or MOV)"), file)

    await waitFor(() => expect(current().source).toBe("upload"))
    expect(current().file_id).toBeTruthy()
    expect(current().url).toBe("")
    expect(body).toMatchObject({
      name: "lesson.mp4",
      purpose: "lms_video",
      content_type: "video/mp4",
      size: 2048,
    })
  })

  it("shows the server's refusal and keeps the block as it was", async () => {
    server.use(http.post(apiUrl("/v1/files"), () => problem(413, "files/too-large", "The file is too large")))
    const { user } = renderLms(<Editor />)

    await user.upload(
      screen.getByLabelText("Video file (MP4, WebM or MOV)"),
      new File([new Uint8Array(16)], "big.mp4", { type: "video/mp4" }),
    )

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument())
    expect(current().source).toBe("link")
    expect(current().file_id).toBeNull()
  })

  it("previews an uploaded video and removes it", async () => {
    const { user } = renderLms(<Editor initial={{ ...empty, source: "upload", file_id: "f1" }} />)

    await waitFor(() => expect(document.querySelector("video")?.getAttribute("src")).toContain("/draft/v1.mp4"))
    expect(screen.getByRole("button", { name: "Replace video" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Remove video" }))

    expect(current()).toMatchObject({ source: "link", file_id: null, url: "" })
    expect(document.querySelector("video")).toBeNull()
  })
})

describe("video player", () => {
  it("streams an uploaded video from the URL the LMS issues", async () => {
    renderLms(
      <VideoBlock url="" caption="Lecture" source="upload" fileId="f1" blockId="v1" courseId="c1" stepId="s1" />,
    )
    await waitFor(() =>
      expect(document.querySelector("video")?.getAttribute("src")).toBe("https://storage.test/video/v1.mp4?sig=1"),
    )
    expect(document.querySelector("video")?.hasAttribute("controls")).toBe(true)
  })

  it("uses the draft stream in a preview", async () => {
    renderLms(
      <VideoBlock url="" caption="" source="upload" fileId="f1" blockId="v1" courseId="c1" stepId="s1" preview />,
    )
    await waitFor(() => expect(document.querySelector("video")?.getAttribute("src")).toContain("/draft/v1.mp4"))
  })

  it("says so when the student has no access", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:courseId/steps/:stepId/blocks/:blockId/video"), () =>
        problem(403, "lms/not-enrolled", "Not enrolled"),
      ),
    )
    renderLms(<VideoBlock url="" caption="" source="upload" fileId="f1" blockId="v1" courseId="c1" stepId="s1" />)
    expect(await screen.findByText("This video cannot be shown.")).toBeInTheDocument()
    expect(document.querySelector("video")).toBeNull()
  })

  it("remembers the position and resumes from it", async () => {
    localStorage.clear()
    renderLms(<VideoBlock url="" caption="" source="upload" fileId="f-pos" blockId="v1" courseId="c1" stepId="s1" />)
    await waitFor(() => expect(document.querySelector("video")).not.toBeNull())
    const video = document.querySelector("video") as HTMLVideoElement

    video.currentTime = 42
    fireEvent.pause(video)
    expect(loadVideoPosition("f-pos")).toBe(42)

    video.currentTime = 0
    fireEvent.loadedMetadata(video)
    expect(video.currentTime).toBe(42)

    fireEvent.ended(video)
    expect(loadVideoPosition("f-pos")).toBeNull()
  })

  it("does not resume at the very start or at the very end", () => {
    saveVideoPosition("k", 1)
    expect(resumeAt(loadVideoPosition("k"), 600)).toBeNull()
    expect(resumeAt(598, 600)).toBeNull()
    expect(resumeAt(120, 600)).toBe(120)
  })
})
