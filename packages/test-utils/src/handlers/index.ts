import { aiHandlers } from "./ai"
import { assessmentsHandlers } from "./assessments"
import { broadcastsHandlers } from "./broadcasts"
import { classworkHandlers } from "./classwork"
import { compositionHandlers } from "./composition"
import { filesHandlers } from "./files"
import { flashcardsHandlers } from "./flashcards"
import { idHandlers } from "./id"
import { idAdminHandlers } from "./id-admin"
import { libraryHandlers } from "./library"
import { linksHandlers } from "./links"
import { lmsAuthoringHandlers } from "./lms-authoring"
import { lmsLearningHandlers } from "./lms-learning"
import { marksHandlers } from "./marks"
import { notebooksHandlers } from "./notebooks"
import { notificationsHandlers } from "./notifications"
import { oauthHandlers } from "./oauth"
import { publicHandlers } from "./public"
import { pushHandlers } from "./push"
import { registrationHandlers } from "./registration"
import { scheduleHandlers } from "./schedule"
import { webSearchHandlers } from "./web-search"

export { errorHandlers } from "./errors"
export { applyOutlineOps } from "./lms-authoring"
export { resetAssessments } from "./assessments"
export { resetCreatedFiles, storedObjects } from "./files"
export {
  notebookFixtureSources,
  resetNotebooksState,
  seedNotebookSource,
  setCourseApplyMode,
  setCourseWorkspaceReadOnly,
  type CourseApplyMode,
} from "./notebooks"
export { userForRequest } from "./id"
export {
  getLibraryActor,
  getUniLibrary,
  resetLibraryState,
  seedLibraryItem,
  setLibraryActor,
  setUniLibrary,
  type LibraryActorSpec,
} from "./library"
export { pushSubscriptions, resetPushSubscriptions } from "./push"
export { currentWebQuota, resetWebSearchState, setWebQuota, spendWebSearch } from "./web-search"
export { apiUrl, notFound, paginate, problem } from "./utils"
export {
  aiHandlers,
  assessmentsHandlers,
  broadcastsHandlers,
  classworkHandlers,
  compositionHandlers,
  filesHandlers,
  flashcardsHandlers,
  idAdminHandlers,
  idHandlers,
  libraryHandlers,
  linksHandlers,
  lmsAuthoringHandlers,
  lmsLearningHandlers,
  marksHandlers,
  notebooksHandlers,
  notificationsHandlers,
  oauthHandlers,
  publicHandlers,
  pushHandlers,
  registrationHandlers,
  scheduleHandlers,
  webSearchHandlers,
}

/**
 * Handlers for every endpoint of backend/FINAL_PLAN.md § API contract, matched against `TEST_API_URL`.
 * `compositionHandlers` come first so `GET /v1/admin/groups/stats` is not taken for `GET /v1/admin/groups/:id`.
 */
export const allHandlers = [
  ...compositionHandlers,
  ...oauthHandlers,
  ...idHandlers,
  ...idAdminHandlers,
  ...registrationHandlers,
  ...scheduleHandlers,
  ...classworkHandlers,
  ...marksHandlers,
  ...assessmentsHandlers,
  ...filesHandlers,
  ...linksHandlers,
  ...publicHandlers,
  ...notificationsHandlers,
  ...pushHandlers,
  ...broadcastsHandlers,
  ...webSearchHandlers,
  ...aiHandlers,
  ...flashcardsHandlers,
  ...notebooksHandlers,
  ...lmsLearningHandlers,
  ...lmsAuthoringHandlers,
  ...libraryHandlers,
]
