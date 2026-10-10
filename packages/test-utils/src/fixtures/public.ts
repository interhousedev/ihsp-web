import type { PublicShare } from "@ihsp/api"
import { flashcardCards } from "./flashcards"
import { quizContent, reportContent } from "./notebooks"

export const publicShareChat: PublicShare = {
  kind: "chat",
  title: "Kinematics revision",
  author_first_name: "Aleksey",
  created_at: "2026-10-02T14:00:00Z",
  chat: {
    messages: [
      { role: "user", text: "Explain uniform motion", tool_notes: [] },
      {
        role: "assistant",
        text: "In **uniform motion** the velocity is constant, so $x = x_0 + vt$.",
        tool_notes: ["Looked up your timetable"],
      },
    ],
  },
  flashcards: null,
}

export const publicShareFlashcards: PublicShare = {
  kind: "flashcard_set",
  title: "Physics: kinematics",
  author_first_name: "Aleksey",
  created_at: "2026-10-03T10:00:00Z",
  chat: null,
  flashcards: { cards: flashcardCards.map((card) => ({ id: card.id, front: card.front, back: card.back })) },
}

/** A shared Studio output (`a-` slugs): its kind, options and content, as the viewers render them. */
export const publicShareQuiz: PublicShare = {
  kind: "artifact",
  title: "Photosynthesis: quiz",
  author_first_name: "Aleksey",
  created_at: "2026-10-04T10:00:00Z",
  chat: null,
  flashcards: null,
  artifact: { kind: "quiz", options: {}, content: { ...quizContent } },
}

export const publicShareReport: PublicShare = {
  kind: "artifact",
  title: "Photosynthesis: conspect",
  author_first_name: "Aleksey",
  created_at: "2026-10-04T11:00:00Z",
  chat: null,
  flashcards: null,
  artifact: { kind: "report", options: {}, content: { ...reportContent } },
}

/** Slugs the public handlers know; every other slug is `404`, `gone` is `410`. */
export const publicShares: Record<string, PublicShare> = {
  kq7x2m9a: publicShareChat,
  zr5t8w1c: publicShareFlashcards,
  "a-quiz0001": publicShareQuiz,
  "a-report01": publicShareReport,
}

export const publicShareGoneSlug = "gone0000"

export const roomPageHtml =
  "<!doctype html><html><body><h1>Room 102</h1><p>3 Physics · 2TN2 · Kalandarova G.</p></body></html>"
export const shortLinkHtml = "<!doctype html><html><body><p>You are leaving IHSP</p></body></html>"
export const icalBody = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//IHSP//Timetable//EN\r\nEND:VCALENDAR\r\n"
