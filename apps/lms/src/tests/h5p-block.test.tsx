import { describe, expect, it, setDefaultTimeout } from "bun:test"
import type { LearningH5PBlock, XapiStatement } from "@ihsp/api"
import { apiUrl, h5pPackageFixture, server } from "@ihsp/test-utils"
import { act, screen, waitFor } from "@testing-library/react"
import { http } from "msw"
import { useState } from "react"
import { H5PBlock } from "../features/player/components/h5p-block"
import {
  h5pBaseUrl,
  h5pPlayerSrc,
  isResultStatement,
  parsePlayerMessage,
  trimStatement,
} from "../features/player/utils/h5p"
import { H5PBlockEditor } from "../features/step-editor/components/h5p-block-editor"
import { newH5PBlock, validateContent, type H5PBlock as AuthorBlock } from "../features/step-editor/utils/content-ops"
import { readBody, renderLms } from "./helpers"

setDefaultTimeout(60_000)

const COMPLETED = "http://adlnet.gov/expapi/verbs/completed"
const ANSWERED = "http://adlnet.gov/expapi/verbs/answered"

describe("H5P helpers", () => {
  it("keeps only root completed / answered statements with a result", () => {
    const root: XapiStatement = { verb: { id: COMPLETED }, result: { score: { raw: 2, max: 3 }, completion: true } }
    const child: XapiStatement = { ...root, verb: { id: ANSWERED }, context: { contextActivities: { parent: [{}] } } }
    expect(isResultStatement(root)).toBe(true)
    expect(isResultStatement(child)).toBe(false)
    expect(isResultStatement({ verb: { id: "http://adlnet.gov/expapi/verbs/attempted" }, result: {} })).toBe(false)
    expect(isResultStatement({ verb: { id: COMPLETED } })).toBe(false)
    expect(trimStatement({ ...root, object: { id: "x" } })).toEqual({ verb: { id: COMPLETED }, result: root.result })
  })

  it("loads package files same-origin in production and from the API in next dev", () => {
    expect(h5pBaseUrl("/v1/lms/h5p/tok/", false)).toBe("/v1/lms/h5p/tok")
    expect(h5pBaseUrl("/v1/lms/h5p/tok/", true)).toMatch(/^https?:\/\/.+\/v1\/lms\/h5p\/tok$/)
  })
})

const learner: LearningH5PBlock = {
  id: "h1",
  type: "h5p",
  package_id: h5pPackageFixture.package_id,
  title: "Quiz",
  main_library: "H5P.QuestionSet",
  passing_score_pct: 50,
  passed: false,
}

describe("H5P player messages", () => {
  const win = {}
  const good = { type: "ihsp-h5p-xapi", verb: COMPLETED, score: { raw: 3, max: 4 }, completion: true }
  const parse = (data: unknown, over: { source?: unknown; origin?: string } = {}) =>
    parsePlayerMessage({ source: win, origin: "null", data, ...over }, win)

  it("accepts only the strict shape from the frame window with the opaque origin", () => {
    expect(parse(good)).toEqual({
      kind: "xapi",
      statement: { verb: { id: COMPLETED }, result: { score: { raw: 3, max: 4 }, completion: true } },
    })
    expect(parse({ ...good, extra: 1 })).not.toBeNull() // unknown fields are dropped, not forwarded
    expect(parse(good, { source: {} })).toBeNull()
    expect(parse(good, { origin: window.location.origin })).toBeNull()
    expect(parse({ ...good, verb: "http://adlnet.gov/expapi/verbs/attempted" })).toBeNull()
    expect(parse({ ...good, score: { raw: 5, max: 4 } })).toBeNull()
    expect(parse({ ...good, score: { raw: -1, max: 4 } })).toBeNull()
    expect(parse({ ...good, score: { raw: "3", max: 4 } })).toBeNull()
    expect(parse({ ...good, score: { raw: 1, max: 0 } })).toBeNull()
    expect(parse({ ...good, score: { raw: Number.NaN, max: 4 } })).toBeNull()
    expect(parse({ ...good, completion: "yes" })).toBeNull()
    expect(parse("text")).toBeNull()
    expect(parse(null)).toBeNull()
    expect(parsePlayerMessage({ source: null, origin: "null", data: good }, null)).toBeNull()
    expect(parse({ type: "ihsp-h5p-size", height: 300 })).toEqual({ kind: "size", height: 300 })
    expect(parse({ type: "ihsp-h5p-size", height: 1e9 })).toBeNull()
  })

  it("hands the package path to the frame through the hash", () => {
    expect(h5pPlayerSrc("/v1/lms/h5p/tok", "h1")).toBe("/h5p-player/player.html#base=%2Fv1%2Flms%2Fh5p%2Ftok&id=h1")
  })
})

describe("H5P player", () => {
  it("renders the frame with sandbox exactly allow-scripts and sends the root result", async () => {
    let sent: unknown
    server.use(
      http.post(apiUrl("/v1/lms/steps/:stepId/blocks/:blockId/h5p-result"), async ({ request }) => {
        sent = await readBody(request)
        return Response.json({ score: 3, max_score: 4, completed: true })
      }),
    )
    renderLms(<H5PBlock block={learner} courseId="c1" stepId="s1" preview={false} />)

    const frame = (await screen.findByTitle("Quiz")) as HTMLIFrameElement
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts")
    expect(frame.getAttribute("src")).toContain("/h5p-player/player.html#base=%2Fv1%2Flms%2Fh5p%2Ftoken-h1")

    const data = { type: "ihsp-h5p-xapi", verb: COMPLETED, score: { raw: 3, max: 4 }, completion: true }
    // A message that does not come from the frame window is ignored.
    act(() => {
      window.dispatchEvent(new MessageEvent("message", { data, origin: "null", source: window }))
    })
    expect(sent).toBeUndefined()
    act(() => {
      window.dispatchEvent(new MessageEvent("message", { data, origin: "null", source: frame.contentWindow }))
    })
    expect(await screen.findByText("Best result: 3 of 4")).toBeTruthy()
    expect(sent).toEqual({
      statement: { verb: { id: COMPLETED }, result: { score: { raw: 3, max: 4 }, completion: true } },
    })
  })
})

function Editor() {
  const [block, setBlock] = useState<AuthorBlock>(newH5PBlock())
  return (
    <>
      <H5PBlockEditor block={block} onChange={setBlock} courseId="c1" stepId="s1" />
      <output data-testid="block">{JSON.stringify(block)}</output>
    </>
  )
}

const current = () => JSON.parse(screen.getByTestId("block").textContent ?? "{}") as AuthorBlock

describe("H5P editor", () => {
  it("uploads the package and keeps its id, title and main library", async () => {
    const { user } = renderLms(<Editor />)
    expect(validateContent({ title: "t", blocks: [current()] }).map((issue) => issue.code)).toEqual(["empty-h5p"])

    await user.upload(screen.getByLabelText("H5P package (.h5p)"), new File(["PK"], "quiz.h5p"))

    await waitFor(() => expect(current().package_id).toBe(h5pPackageFixture.package_id))
    expect(current().main_library).toBe("H5P.QuestionSet")
    expect(screen.getByText("Fractions quiz")).toBeTruthy()
  })

  it("shows the server's refusal of a bad package", async () => {
    const { user } = renderLms(<Editor />)
    await user.upload(screen.getByLabelText("H5P package (.h5p)"), new File(["x"], "bad.h5p"))
    expect(await screen.findByRole("alert")).toBeTruthy()
    expect(current().package_id).toBe("")
  })
})
