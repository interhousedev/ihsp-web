/** UF-WEB-22: study a deck like in Anki: deck list, overview, show the answer (button and Space), rate with the buttons and the keys 1-4. */

import type { FlashcardSetDetail, StudyNext } from "@ihsp/api"
import { STUDENT } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { unique } from "./fixtures/data"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading } from "./fixtures/ui"

test("UF-WEB-22 study a set with the keyboard and the buttons", async ({ page }, testInfo) => {
  await loginAs(page, STUDENT, "sp")
  const title = unique("E2E derivatives")
  const set = await api<FlashcardSetDetail>(page, "POST", "/v1/me/flashcard-sets", {
    title,
    cards: [
      { front: "Derivative of x^2", back: "2x" },
      { front: "Derivative of sin x", back: "cos x" },
      { front: "Derivative of e^x", back: "e^x" },
    ],
  })

  try {
    // The deck is in the deck list with its New, Learn and Due counts, and opens its overview.
    await page.goto(`${URLS.sp}/flashcards/`)
    await expect(heading(page, "Flash cards", 1)).toBeVisible()
    const deckRow = page.getByRole("row").filter({ has: page.getByRole("link", { name: title }) })
    await expect(deckRow).toBeVisible()
    await expect(deckRow.getByRole("cell").first()).toHaveText("3")
    await a11y(page, testInfo, { label: "sp flashcards" })
    await page.getByRole("link", { name: title }).first().click()
    await expect(page).toHaveURL(new RegExp(`/flashcards/set/\\?id=${set.id}`))
    await expect(heading(page, title, 1)).toBeVisible()
    await expect(page.getByText("3 cards")).toBeVisible()
    await a11y(page, testInfo, { label: "sp flashcards overview" })

    // Study now.
    await page.getByRole("link", { name: "Study now" }).click()
    await expect(page).toHaveURL(new RegExp(`/flashcards/study/\\?id=${set.id}`))
    const showAnswer = page.getByRole("button", { name: /^Show answer/ })

    // Card 1: button, then the rating button.
    await expect(showAnswer).toBeVisible()
    await a11y(page, testInfo, { label: "sp study front" })
    await showAnswer.click()
    await expect(page.getByRole("group", { name: "How well did you know it?" })).toBeVisible()
    await a11y(page, testInfo, { label: "sp study back" })
    await page.getByRole("button", { name: "Good" }).click()

    // Card 2: Space shows the answer, 3 is "Good".
    await expect(showAnswer).toBeVisible()
    await page.keyboard.press("Space")
    await expect(page.getByRole("group", { name: "How well did you know it?" })).toBeVisible()
    await page.keyboard.press("3")

    // Card 3: Space, 4 is "Easy".
    await expect(showAnswer).toBeVisible()
    await page.keyboard.press("Space")
    await page.keyboard.press("4")

    await expect(heading(page, "Congratulations! You have finished this deck for now.")).toBeVisible()
    await expect(page.getByText("You answered 3 cards.")).toBeVisible()

    // The reviews were saved: no card is due right now (a "Good" card comes back in 10 minutes).
    const study = await api<StudyNext>(page, "GET", `/v1/me/flashcard-sets/${set.id}/study`)
    expect(study.done_for_today).toBe(true)
  } finally {
    await api(page, "DELETE", `/v1/me/flashcard-sets/${set.id}`).catch(() => undefined)
  }
})
