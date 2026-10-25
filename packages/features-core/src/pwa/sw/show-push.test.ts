import { describe, expect, it, mock } from "bun:test"
import { DEFAULT_TITLE, showPush } from "./push"

function registration(failFirst = false) {
  let calls = 0
  const showNotification = mock(async (_title: string, _options: object) => {
    calls += 1
    if (failFirst && calls === 1) throw new TypeError("bad options")
  })
  return { showNotification }
}

const data = (text: string) => ({ text: () => text })

describe("showPush (the service worker's push event)", () => {
  it("shows the backend's title, body and link", async () => {
    const reg = registration()
    await showPush(reg, data(JSON.stringify({ title: "New mark", body: "Math: 5", url: "https://my.ihsu.uz/grades/" })))

    expect(reg.showNotification).toHaveBeenCalledTimes(1)
    const [title, options] = reg.showNotification.mock.calls[0] as [string, { body: string; data: { url: string } }]
    expect(title).toBe("New mark")
    expect(options.body).toBe("Math: 5")
    expect(options.data.url).toBe("https://my.ihsu.uz/grades/")
  })

  it("still shows a notification for an empty push", async () => {
    const reg = registration()
    await showPush(reg, null)

    expect(reg.showNotification).toHaveBeenCalledTimes(1)
    expect(reg.showNotification.mock.calls[0]?.[0]).toBe(DEFAULT_TITLE)
  })

  it("still shows a notification when the payload cannot be read", async () => {
    const reg = registration()
    await showPush(reg, {
      text: () => {
        throw new Error("not text")
      },
    })

    expect(reg.showNotification).toHaveBeenCalledTimes(1)
  })

  it("falls back to a plain notification when the browser refuses the options", async () => {
    const reg = registration(true)
    await showPush(reg, data(JSON.stringify({ title: "Homework", body: "Due tomorrow" })))

    expect(reg.showNotification).toHaveBeenCalledTimes(2)
    expect(reg.showNotification.mock.calls[1]?.[0]).toBe("Homework")
  })
})
