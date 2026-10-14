import { adminAiHandlers } from "./admin-ai"
import { aiHandlers } from "./ai"
import { assessmentsHandlers } from "./assessments"
import { broadcastsHandlers } from "./broadcasts"
import { classworkHandlers } from "./classwork"
import { compositionHandlers } from "./composition"
import { curriculumHandlers } from "./curriculum"
import { meSyncHandlers } from "./me-sync"
import { dashboardHandlers } from "./dashboard"
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
import { presentationPlansHandlers } from "./presentation-plans"
import { staffSubjectsHandlers } from "./staff-subjects"
import { subjectMaterialsHandlers } from "./subject-materials"
import { teachersHandlers } from "./teachers"
import { webSearchHandlers } from "./web-search"

export { errorHandlers } from "./errors"
export { applyOutlineOps } from "./lms-authoring"
export { resetAssessments } from "./assessments"
export { resetMeSyncState } from "./me-sync"
export { resetAdminAiState } from "./admin-ai"
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
export { resetPresentationPlansState } from "./presentation-plans"
export { resetStaffSubjectsState } from "./staff-subjects"
export { resetSubjectMaterialsState } from "./subject-materials"
export { resetTeacherContacts, resetTeacherPhotos, teacherPhotoUploads, type TeacherPhotoUpload } from "./teachers"
export { pushSubscriptions, resetPushSubscriptions } from "./push"
export { currentWebQuota, resetWebSearchState, setWebQuota, spendWebSearch } from "./web-search"
export { apiUrl, notFound, paginate, problem } from "./utils"
export {
  adminAiHandlers,
  aiHandlers,
  assessmentsHandlers,
  broadcastsHandlers,
  classworkHandlers,
  compositionHandlers,
  curriculumHandlers,
  meSyncHandlers,
  dashboardHandlers,
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
  staffSubjectsHandlers,
  presentationPlansHandlers,
  subjectMaterialsHandlers,
  teachersHandlers,
  webSearchHandlers,
}

/**
 * Handlers for every endpoint of backend/openapi/openapi.json, matched against `TEST_API_URL`.
 * `compositionHandlers` come first so `GET /v1/admin/groups/stats` is not taken for `GET /v1/admin/groups/:id`.
 */
export const allHandlers = [
  ...compositionHandlers,
  ...oauthHandlers,
  ...idHandlers,
  ...idAdminHandlers,
  ...registrationHandlers,
  ...scheduleHandlers,
  ...curriculumHandlers,
  ...meSyncHandlers,
  ...teachersHandlers,
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
  ...adminAiHandlers,
  ...aiHandlers,
  ...flashcardsHandlers,
  ...dashboardHandlers,
  ...notebooksHandlers,
  ...lmsLearningHandlers,
  ...lmsAuthoringHandlers,
  ...libraryHandlers,
  ...subjectMaterialsHandlers,
  ...staffSubjectsHandlers,
  ...presentationPlansHandlers,
]
