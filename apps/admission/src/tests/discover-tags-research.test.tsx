import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import type { AdmissionUniChat } from "@ihsp/api"
import { useTagLabel } from "../features/discover/components/tag-label"
import { useRunDefault } from "../features/discover/use-run-default"
import { renderAdmissionApp } from "./helpers"

function Tags({ tags }: { tags: string[] }) {
  const label = useTagLabel()
  return (
    <ul>
      {tags.map((tag) => (
        <li key={tag}>{label(tag)}</li>
      ))}
    </ul>
  )
}

describe("discover tag labels", () => {
  test("show copy, major names, countries and humanized values, never a raw key", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/career/majors"), () =>
        HttpResponse.json({
          items: [
            {
              id: "m1",
              code: "computer_science",
              name: { en: "Computer Science", ru: "Информатика", uz: "Informatika" },
              area: "stem",
              minor_ok: true,
              active: true,
              sort_order: 1,
            },
          ],
        }),
      ),
    )
    const tags = ["budget:any", "major:computer_science", "region:GB", "major:natural-sciences", "setting:city"]
    renderAdmissionApp(<Tags tags={tags} />)
    expect(await screen.findByText("Computer Science")).toBeInTheDocument()
    expect(screen.getByText("Any budget")).toBeInTheDocument()
    expect(screen.getByText("United Kingdom")).toBeInTheDocument()
    expect(screen.getByText("Natural sciences")).toBeInTheDocument()
    expect(screen.getByText("City campus")).toBeInTheDocument()
    for (const tag of tags) expect(screen.queryByText(tag)).not.toBeInTheDocument()
  })
})

const chat: AdmissionUniChat = {
  chat_id: "c1",
  institution_id: "u1",
  created: true,
  has_default_prompt: false,
  auto_run_pending: true,
}

function Runner({ value }: { value: AdmissionUniChat }) {
  const { state } = useRunDefault(value)
  return <p>{state.status}</p>
}

describe("discover auto research", () => {
  test("a pending chat runs the research once, with auto=true", async () => {
    const calls: string[] = []
    server.use(
      http.post(apiUrl("/v1/admission/uni-chats/u1/run-default"), ({ request }) => {
        calls.push(new URL(request.url).search)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const view = renderAdmissionApp(<Runner value={chat} />)
    await waitFor(() => expect(calls).toEqual(["?auto=true"]))
    view.rerender(<Runner value={{ ...chat }} />)
    await waitFor(() => expect(screen.getByText("idle")).toBeInTheDocument())
    expect(calls).toEqual(["?auto=true"])
  })

  test("a chat already researched does not run", async () => {
    const calls: string[] = []
    server.use(
      http.post(apiUrl("/v1/admission/uni-chats/u1/run-default"), () => {
        calls.push("run")
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<Runner value={{ ...chat, created: false, auto_run_pending: false }} />)
    expect(await screen.findByText("idle")).toBeInTheDocument()
    await Bun.sleep(50)
    expect(calls).toEqual([])
  })
})
