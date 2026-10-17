// LMS — H5P packages and interactive video blocks (editor and learner player).
// TODO(contract): hand-written until openapi/openapi.json of iht-backend is exported with these routes.

/** An uploaded `.h5p` package, unpacked under the course; its id goes into an H5P block. */
export type H5PPackage = {
  package_id: string
  title: string
  main_library: string
  files: number
  byte_size: number
}

/** Where the player loads a package from: a signed, short-lived base path on the API (ends with `/`). */
export type H5PLaunch = { base_url: string; expires_in: number }

/** An H5P block of the step content (authoring). */
export type H5PBlock = {
  id: string
  type: "h5p"
  package_id: string
  title: string
  main_library: string
  passing_score_pct: number
}

export type InteractionKind = "question" | "note" | "link"

/** A pause of an interactive video (authoring: options carry `correct`). */
export type Interaction = {
  id: string
  at_sec: number
  kind: InteractionKind
  text: string
  options: { id: string; text: string; correct: boolean; pinned: boolean }[]
  multiple: boolean
  url: string
  points: number
}

/** An interactive video block (authoring). */
export type InteractiveVideoBlock = {
  id: string
  type: "interactive_video"
  source: "link" | "upload"
  url: string
  file_id: string | null
  caption: string
  interactions: Interaction[]
}

/** My result of an H5P or interactive video block. */
export type BlockResult = { score: number; max_score: number; completed: boolean }

/** A pause of an interactive video as the student sees it (no correctness). */
export type LearningInteraction = {
  id: string
  at_sec: number
  kind: InteractionKind
  text: string
  url: string
  multiple: boolean
  points: number
  options: { id: string; text: string }[]
}

export type InteractionAnswer = { option_ids: string[]; correct: boolean }

export type LearningH5PBlock = {
  id: string
  type: "h5p"
  package_id: string
  title: string
  main_library: string
  passing_score_pct: number
  result?: BlockResult | null
  passed: boolean
}

export type LearningInteractiveVideoBlock = {
  id: string
  type: "interactive_video"
  source: "link" | "upload"
  url: string
  file_id: string | null
  caption: string
  interactions: LearningInteraction[]
  answers?: Record<string, InteractionAnswer>
  result?: BlockResult | null
  passed: boolean
}

/** `POST .../interactions/{id}/answer`: the graded answer, the right options and the block total. */
export type InteractionResult = {
  answer: InteractionAnswer
  correct_option_ids: string[]
  result: BlockResult
}

/** An xAPI statement of the H5P player (only root `completed` / `answered` ones change the result). */
export type XapiStatement = {
  verb?: { id?: string }
  result?: {
    score?: { raw?: number; max?: number; scaled?: number }
    completion?: boolean
    success?: boolean
  }
  context?: { contextActivities?: { parent?: unknown[] } }
  object?: { id?: string }
}
