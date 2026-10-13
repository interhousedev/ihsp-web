import { describe, expect, test } from "bun:test"
import { readNotebookStream, readSse } from "../sse"

function body(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

async function collect<T>(iterator: AsyncGenerator<T>): Promise<T[]> {
  const items: T[] = []
  for await (const item of iterator) items.push(item)
  return items
}

describe("readSse", () => {
  test("joins an event that is split across chunks", async () => {
    const events = await collect(readSse(body(["event: delta\nda", 'ta: {"text":"Hi"}\n', "\n"])))

    expect(events).toEqual([{ event: "delta", data: '{"text":"Hi"}' }])
  })

  test("reads several events, comments and CRLF line ends", async () => {
    const events = await collect(
      readSse(body([": ping\r\n\r\nevent: a\r\ndata: 1\r\n\r\nevent: b\ndata: 2\ndata: 3\n\n"])),
    )

    expect(events).toEqual([
      { event: "a", data: "1" },
      { event: "b", data: "2\n3" },
    ])
  })

  test("returns an event that has no final blank line", async () => {
    const events = await collect(readSse(body(["event: done\ndata: {}"])))

    expect(events).toEqual([{ event: "done", data: "{}" }])
  })
})

describe("readNotebookStream", () => {
  test("types the events, skips unknown ones and wraps a bare done message", async () => {
    const response = new Response(
      body([
        'event: message\ndata: {"id":"u1","seq":5}\n\n',
        'event: delta\ndata: {"text":"Hello"}\n\n',
        "event: other\ndata: {}\n\n",
        "event: delta\ndata: not json\n\n",
        'event: done\ndata: {"id":"a1","seq":6,"role":"assistant","text":"Hello","usage":{"generating":0}}\n\n',
      ]),
    )

    const events = await collect(readNotebookStream(response))

    expect(events.map((event) => event.event)).toEqual(["message", "delta", "done"])
    const done = events[2]
    expect(done?.event === "done" && done.data.assistant_message.text).toBe("Hello")
  })

  test("passes the web event through with its typed results, before the answer text", async () => {
    const results = [
      {
        n: 1,
        title: "Photosynthesis - Wikipedia",
        url: "https://uz.wikipedia.org/wiki/Fotosintez",
        site: "uz.wikipedia.org",
        snippet: "Photosynthesis is the process by which plants turn light into sugar.",
        why: "Defines the process",
        cited: false,
      },
    ]
    const response = new Response(
      body([
        `event: web\ndata: ${JSON.stringify({ results })}\n\n`,
        'event: delta\ndata: {"text":"Plants make sugar ⟦w1⟧"}\n\n',
        'event: done\ndata: {"id":"a1","seq":6,"role":"assistant","text":"Plants make sugar ⟦w1⟧"}\n\n',
      ]),
    )

    const events = await collect(readNotebookStream(response))

    expect(events.map((event) => event.event)).toEqual(["web", "delta", "done"])
    const web = events[0]
    expect(web?.event === "web" && web.data.results).toEqual(results)
    expect(web?.event === "web" && web.data.results[0]?.n).toBe(1)
  })
})

describe("AI-STEPS readNotebookStream steps", () => {
  test("passes step events through, running then done", async () => {
    const step = { id: "s1", kind: "retrieve", label: "Searched the sources", status: "running" }
    const response = new Response(
      body([
        'event: message\ndata: {"id":"u1","seq":1}\n\n',
        `event: step\ndata: ${JSON.stringify(step)}\n\n`,
        `event: step\ndata: ${JSON.stringify({ ...step, status: "done", duration_ms: 12 })}\n\n`,
      ]),
    )

    const events = await collect(readNotebookStream(response))

    expect(events.map((event) => event.event)).toEqual(["message", "step", "step"])
    const last = events[2]
    expect(last?.event === "step" && last.data.status).toBe("done")
  })
})
