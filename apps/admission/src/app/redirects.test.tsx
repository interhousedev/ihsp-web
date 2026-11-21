import { setTestRoute, testRouter } from "@ihsp/test-utils"
import { render, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, test } from "bun:test"
import { redirectUrl } from "../components/route-redirect"
import Alignment from "./alignment/page"
import Algorithm from "./colleges/algorithm/page"
import Colleges from "./colleges/page"
import Deadlines from "./deadlines/page"
import ActivityView from "./activities/view/page"
import Profile from "./profile/page"
import Words from "./words/page"

function open(route: string, hash = "") {
  setTestRoute(route)
  window.location.hash = hash
}

describe("old routes", () => {
  beforeEach(() => {
    window.location.hash = ""
  })

  test("/activities/view/?id= maps id to item and keeps other params", async () => {
    open("/activities/view/?id=a1&from=plan")
    render(<ActivityView />)
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/activities/?item=a1&from=plan"))
  })

  test("/activities/view/ without an id opens a new item", async () => {
    open("/activities/view/")
    render(<ActivityView />)
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/activities/?item=new"))
  })

  test("/colleges/ and /colleges/algorithm/ land on the search", async () => {
    open("/colleges/?country=uz")
    render(<Colleges />)
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/chooser/?step=match&country=uz"))
    open("/colleges/algorithm/")
    render(<Algorithm />)
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/chooser/?step=quiz"))
  })

  test("/words/ keeps the target hash and /alignment/ the incoming query", async () => {
    open("/words/", "#old")
    render(<Words />)
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/essays/?tab=story#words"))
    open("/alignment/?entry=e1")
    render(<Alignment />)
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/essays/?tab=alignment&entry=e1"))
  })

  test("/deadlines/ opens the tasks page, where deadlines are the default view", async () => {
    open("/deadlines/")
    render(<Deadlines />)
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/tasks/?view=gantt"))
  })

  test("/profile/ turns the old tab into a section of the settings tab", async () => {
    open("/profile/?tab=background", "#services")
    render(<Profile />)
    await waitFor(() =>
      expect(testRouter.replace).toHaveBeenCalledWith("/settings/?tab=profile&section=background#services"),
    )
  })
})

describe("redirectUrl", () => {
  test("keeps the incoming hash when the target has none", () => {
    expect(redirectUrl({ to: "/x/" }, new URLSearchParams("a=1"), "#h")).toBe("/x/?a=1#h")
  })
})
