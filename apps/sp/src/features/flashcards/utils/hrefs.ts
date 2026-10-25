/** Routes of the flash card pages (static export: the set is in the query string). */
const query = (id: string) => `?id=${encodeURIComponent(id)}`

export const deckHref = (id: string) => `/flashcards/set/${query(id)}`
export const studyHref = (id: string) => `/flashcards/study/${query(id)}`
export const editHref = (id: string) => `/flashcards/edit/${query(id)}`
/** The overview with its Options dialog open. */
export const optionsHref = (id: string) => `/flashcards/set/${query(id)}&options=1`
