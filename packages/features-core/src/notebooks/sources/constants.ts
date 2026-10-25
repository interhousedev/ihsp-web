/** Sources per notebook (the backend setting `NOTEBOOKS__MAX_SOURCES`; 50 on the default plan). */
export const SOURCE_LIMIT = 50

/** The quiet "12 of 50 sources" footer turns amber from this share of the limit. */
export const LIMIT_WARN_RATIO = 0.9

/** Items of one `POST /notebooks/{id}/sources`. */
export const MAX_ADD_ITEMS = 20

/** Largest pasted text the backend accepts (characters). */
export const MAX_TEXT_CHARS = 600_000

/** Shortest query Discover and the full-text search take (the backend refuses shorter ones). */
export const MIN_SEARCH_LENGTH = 2
