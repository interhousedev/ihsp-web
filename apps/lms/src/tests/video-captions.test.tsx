import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { VideoBlock } from "../features/player/components/video-block"
import { renderLms } from "./helpers"

setDefaultTimeout(60_000)

describe("video captions", () => {
  it("renders a <track> per caption track of a direct video file", async () => {
    server.use(
      http.get(apiUrl("/v1/lms/courses/:courseId/steps/:stepId/blocks/:blockId/captions"), () =>
        HttpResponse.json({
          tracks: [
            { lang: "uz", label: "Oʼzbekcha", default: true, url: "https://storage.test/cap/uz.vtt" },
            { lang: "ru", label: "Русский", default: false, url: "https://storage.test/cap/ru.vtt" },
          ],
          expires_in: 900,
        }),
      ),
      http.get(
        "https://storage.test/cap/:name",
        () => new HttpResponse("WEBVTT\n", { headers: { "Content-Type": "text/vtt" } }),
      ),
    )
    renderLms(
      <VideoBlock
        url="https://cdn.test/lesson.mp4"
        caption=""
        blockId="v1"
        courseId="c1"
        stepId="s1"
        captions={[
          { lang: "uz", label: "Oʼzbekcha", default: true },
          { lang: "ru", label: "Русский", default: false },
        ]}
      />,
    )
    await waitFor(() => expect(document.querySelectorAll("video track[src]").length).toBe(2))
    const uz = document.querySelector('track[srclang="uz"]')
    expect(uz?.getAttribute("kind")).toBe("captions")
    expect(uz?.getAttribute("label")).toBe("Oʼzbekcha")
    expect(uz?.hasAttribute("default")).toBe(true)
    expect(uz?.getAttribute("src")).toStartWith("blob:")
    expect(document.querySelector('track[srclang="ru"]')?.hasAttribute("default")).toBe(false)
  })

  it("renders an empty captions track when the block has none", () => {
    renderLms(<VideoBlock url="https://cdn.test/lesson.mp4" caption="" />)
    expect(document.querySelectorAll("video track").length).toBe(1)
    expect(document.querySelector("video track[src]")).toBeNull()
  })
})
