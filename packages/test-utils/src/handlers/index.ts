import { adminAiHandlers } from "./admin-ai"
import { aiHandlers } from "./ai"
import { assessmentsHandlers } from "./assessments"
import { broadcastsHandlers } from "./broadcasts"
import { certificatesHandlers } from "./certificates"
import { classworkHandlers } from "./classwork"
import { compositionHandlers } from "./composition"
import { curriculumHandlers } from "./curriculum"
import { meSyncHandlers } from "./me-sync"
import { adminJobsHandlers } from "./admin-jobs"
import { adminLogsHandlers } from "./admin-logs"
import { adminKnowledgeHandlers } from "./admin-knowledge"
import { dashboardHandlers } from "./dashboard"
import { filesHandlers } from "./files"
import { flashcardsHandlers } from "./flashcards"
import { idHandlers } from "./id"
import { idAdminHandlers } from "./id-admin"
import { idFactorsHandlers } from "./id-factors"
import { libraryHandlers } from "./library"
import { linksHandlers } from "./links"
import { lmsAuthoringHandlers } from "./lms-authoring"
import { lmsLearningHandlers } from "./lms-learning"
import { lmsImsccHandlers } from "./lms-imscc"
import { lmsInteractiveHandlers } from "./lms-interactive"
import { lmsSettingsHandlers } from "./lms-settings"
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
import { groupProgressHandlers } from "./group-progress"
import { teachersHandlers } from "./teachers"
import { webSearchHandlers } from "./web-search"

export { errorHandlers } from "./errors"
export { applyOutlineOps } from "./lms-authoring"
export { resetAssessments } from "./assessments"
export { resetMeSyncState } from "./me-sync"
export { certificatesImported, resetCertificatesState, setCertificatesStaffForbidden } from "./certificates"
export { resetAdminJobs } from "./admin-jobs"
export { resetAdminKnowledge } from "./admin-knowledge"
export { resetAdminAiState } from "./admin-ai"
export { aiTurnStream } from "./ai"
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
export { resetImsccImports } from "./lms-imscc"
export { h5pPackageFixture } from "./lms-interactive"
export { courseLandingFixture, courseSettingsFixture, resetLmsSettings } from "./lms-settings"
export {
  currentFactors,
  resetFactorsState,
  setFactorsState,
  TOTP_TEST_RECOVERY_CODES,
  TOTP_TEST_SECRET,
} from "./id-factors"
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
  certificatesHandlers,
  classworkHandlers,
  compositionHandlers,
  curriculumHandlers,
  meSyncHandlers,
  adminJobsHandlers,
  adminLogsHandlers,
  adminKnowledgeHandlers,
  dashboardHandlers,
  filesHandlers,
  flashcardsHandlers,
  idAdminHandlers,
  idFactorsHandlers,
  idHandlers,
  libraryHandlers,
  linksHandlers,
  lmsAuthoringHandlers,
  lmsLearningHandlers,
  lmsImsccHandlers,
  lmsInteractiveHandlers,
  lmsSettingsHandlers,
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
  groupProgressHandlers,
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
  ...idFactorsHandlers,
  ...idAdminHandlers,
  ...registrationHandlers,
  ...scheduleHandlers,
  ...curriculumHandlers,
  ...meSyncHandlers,
  ...adminJobsHandlers,
  ...adminLogsHandlers,
  ...adminKnowledgeHandlers,
  ...teachersHandlers,
  ...groupProgressHandlers,
  ...classworkHandlers,
  ...marksHandlers,
  ...assessmentsHandlers,
  ...filesHandlers,
  ...linksHandlers,
  ...publicHandlers,
  ...notificationsHandlers,
  ...pushHandlers,
  ...broadcastsHandlers,
  ...certificatesHandlers,
  ...webSearchHandlers,
  ...adminAiHandlers,
  ...aiHandlers,
  ...flashcardsHandlers,
  ...dashboardHandlers,
  ...notebooksHandlers,
  ...lmsImsccHandlers,
  ...lmsInteractiveHandlers,
  ...lmsSettingsHandlers,
  ...lmsLearningHandlers,
  ...lmsAuthoringHandlers,
  ...libraryHandlers,
  ...subjectMaterialsHandlers,
  ...staffSubjectsHandlers,
  ...presentationPlansHandlers,
]
export { notHeadStudentResponse } from "./group-progress"
