import { beforeAll, describe, expect, it } from "bun:test"
import { waitFor } from "@testing-library/react"
import { MotionGlobalConfig } from "motion/react"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import type { AppReview } from "../features/app-review/api"
import { AppReviewPanel } from "../features/app-review/components/app-review-page"
import { StaffReviewTab } from "../features/app-review/components/staff-review-tab"
import { renderAdmissionApp } from "./helpers"

const URL = apiUrl("/v1/admission/me/application-reviews")
const STAFF_URL = apiUrl("/v1/admission/students/s1/application-reviews")

// Reveal animations would otherwise be cancelled on unmount, which happy-dom rejects.
beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true
})

const base: AppReview = {
  id: "r1",
  version: 1,
  status: "queued",
  locale: "en",
  created_at: "2025-01-01T00:00:00Z",
  started_at: null,
  finished_at: null,
  error_code: null,
  sections: [],
  report: null,
}

const done: AppReview = {
  ...base,
  id: "r2",
  version: 2,
  status: "done",
  sections: [
    {
      key: "activities",
      status: "done",
      score: 8,
      summary: "Robotics carries the story.",
      findings: [{ kind: "strength", text: "Led the robotics club", evidence: ["item:1"] }],
      next_actions: ["Quantify the club results"],
    },
    { key: "essays", status: "skipped", score: null, summary: "", findings: [], next_actions: [] },
  ],
  report: {
    headline: "Strong engineering spike",
    overall_score: 72,
    strengths: [{ text: "Consistent robotics work", section: "activities", evidence: ["item:1"] }],
    risks: [{ text: "No essay draft", section: "essays", evidence: [] }],
    spike: { score: 7, comment: "Clear focus on engineering." },
    next_actions: [{ title: "Draft the main essay", why: "Deadlines are close", section: "essays", priority: 1 }],
    section_scores: [
      { section: "activities", score: 8, comment: "Deep involvement" },
      { section: "essays", score: 0, comment: "" },
    ],
    injection_suspected: false,
    fallback: false,
  },
}

describe("AppReviewPanel", () => {
  it("starts a review and shows progress", async () => {
    server.use(
      http.get(URL, () => HttpResponse.json({ items: [] })),
      http.post(URL, () => HttpResponse.json(base, { status: 202 })),
    )
    renderAdmissionApp(<AppReviewPanel />)
    await userEvent.click(await screen.findByRole("button", { name: "Review my application" }))
    expect(await screen.findByRole("status")).toHaveTextContent("Queued")
  })

  it("shows a failed latest review, then an earlier report from history", async () => {
    const failed: AppReview = { ...base, id: "r3", version: 3, status: "failed", error_code: "sections_failed" }
    server.use(http.get(URL, () => HttpResponse.json({ items: [failed, done] })))
    renderAdmissionApp(<AppReviewPanel />)
    expect(await screen.findByText("The review could not be finished. Try again later.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /Version 2/ }))
    expect(await screen.findByText("Strong engineering spike")).toBeInTheDocument()
    expect(screen.getByText("72")).toBeInTheDocument()
    expect(screen.getByText("Draft the main essay")).toBeInTheDocument()
    expect(screen.getByText("No data yet")).toBeInTheDocument()
  })

  it("moves the progress as sections finish", async () => {
    const running: AppReview = { ...base, status: "running", sections: done.sections }
    server.use(http.get(URL, () => HttpResponse.json({ items: [running] })))
    renderAdmissionApp(<AppReviewPanel />)
    expect(await screen.findByText("2 of 7 parts reviewed")).toBeInTheDocument()
  })

  it("fills sections in while running and stops polling when done", async () => {
    const pending = (key: string) => ({
      key,
      status: "pending" as const,
      score: null,
      summary: "",
      findings: [],
      next_actions: [],
    })
    const first: AppReview = {
      ...base,
      status: "running",
      sections: [pending("activities")] as AppReview["sections"],
    }
    const second: AppReview = {
      ...base,
      status: "running",
      sections: [done.sections[0]],
    }
    const final: AppReview = { ...done, id: "r1", version: 1 }
    let calls = 0
    server.use(
      http.get(URL, () => {
        calls += 1
        return HttpResponse.json({ items: [calls === 1 ? first : calls === 2 ? second : final] })
      }),
    )
    renderAdmissionApp(<AppReviewPanel />)
    const card = await screen.findByTestId("section-activities")
    expect(card).toHaveAttribute("data-state", "loading")
    expect(screen.queryByText("Robotics carries the story.")).toBeNull()
    expect(await screen.findByText("Robotics carries the story.", {}, { timeout: 6000 })).toBeInTheDocument()
    expect(await screen.findByText("Strong engineering spike", {}, { timeout: 6000 })).toBeInTheDocument()
    const stopped = calls
    await new Promise((r) => setTimeout(r, 3500))
    expect(calls).toBe(stopped)
    await waitFor(() => expect(calls).toBe(3))
  }, 20000)

  it("explains the weekly limit", async () => {
    server.use(
      http.get(URL, () => HttpResponse.json({ items: [] })),
      http.post(URL, () =>
        HttpResponse.json(
          { type: "common/rate-limited", title: "x", status: 429 },
          { status: 429, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<AppReviewPanel />)
    await userEvent.click(await screen.findByRole("button", { name: "Review my application" }))
    expect(await screen.findByText(/used all reviews/)).toBeInTheDocument()
  })
})

describe("StaffReviewTab", () => {
  it("shows the shared report read-only", async () => {
    server.use(http.get(STAFF_URL, () => HttpResponse.json({ items: [done] })))
    renderAdmissionApp(<StaffReviewTab studentId="s1" />)
    expect(await screen.findByText("Strong engineering spike")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Review/ })).toBeNull()
  })

  it("shows no access on 404", async () => {
    server.use(
      http.get(STAFF_URL, () =>
        HttpResponse.json(
          { type: "common/not-found", title: "x", status: 404 },
          { status: 404, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<StaffReviewTab studentId="s1" />)
    expect(await screen.findByText("You cannot see this student's reviews")).toBeInTheDocument()
  })
})
