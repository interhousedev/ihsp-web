import { aiHandlers } from "./ai"
import { broadcastsHandlers } from "./broadcasts"
import { classworkHandlers } from "./classwork"
import { compositionHandlers } from "./composition"
import { filesHandlers } from "./files"
import { flashcardsHandlers } from "./flashcards"
import { idHandlers } from "./id"
import { idAdminHandlers } from "./id-admin"
import { linksHandlers } from "./links"
import { lmsAuthoringHandlers } from "./lms-authoring"
import { lmsLearningHandlers } from "./lms-learning"
import { marksHandlers } from "./marks"
import { notificationsHandlers } from "./notifications"
import { oauthHandlers } from "./oauth"
import { publicHandlers } from "./public"
import { registrationHandlers } from "./registration"
import { scheduleHandlers } from "./schedule"

export { errorHandlers } from "./errors"
export { applyOutlineOps } from "./lms-authoring"
export { resetCreatedFiles, storedObjects } from "./files"
export { userForRequest } from "./id"
export { apiUrl, notFound, paginate, problem } from "./utils"
export {
  aiHandlers,
  broadcastsHandlers,
  classworkHandlers,
  compositionHandlers,
  filesHandlers,
  flashcardsHandlers,
  idAdminHandlers,
  idHandlers,
  linksHandlers,
  lmsAuthoringHandlers,
  lmsLearningHandlers,
  marksHandlers,
  notificationsHandlers,
  oauthHandlers,
  publicHandlers,
  registrationHandlers,
  scheduleHandlers,
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
  ...filesHandlers,
  ...linksHandlers,
  ...publicHandlers,
  ...notificationsHandlers,
  ...broadcastsHandlers,
  ...aiHandlers,
  ...flashcardsHandlers,
  ...lmsLearningHandlers,
  ...lmsAuthoringHandlers,
]
