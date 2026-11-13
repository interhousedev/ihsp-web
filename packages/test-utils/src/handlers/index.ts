import { studentCardHandlers } from "./student-card"
import { honoursHandlers } from "./honours"
import { adminAiHandlers } from "./admin-ai"
import { aiHandlers } from "./ai"
import { assessmentsHandlers } from "./assessments"
import { broadcastsHandlers } from "./broadcasts"
import { certificatesHandlers } from "./certificates"
import { classworkHandlers } from "./classwork"
import { temporaryMarksHandlers } from "./temporary-marks"
import { compositionHandlers } from "./composition"
import { curriculumHandlers } from "./curriculum"
import { meSyncHandlers } from "./me-sync"
import { adminJobsHandlers } from "./admin-jobs"
import { adminLogsHandlers } from "./admin-logs"
import { mcpActivityHandlers } from "./mcp-activity"
import { adminKnowledgeHandlers } from "./admin-knowledge"
import { dashboardHandlers } from "./dashboard"
import { filesHandlers } from "./files"
import { sharingHandlers } from "./sharing"
import { flashcardsHandlers } from "./flashcards"
import { idHandlers } from "./id"
import { idAdminHandlers } from "./id-admin"
import { idFactorsHandlers } from "./id-factors"
import { idPersonalTokensHandlers } from "./id-personal-tokens"
import { adminVaultHandlers } from "./admin-vault"
import { libraryHandlers } from "./library"
import { lessonSourcesHandlers } from "./lesson-sources"
import { linksHandlers } from "./links"
import { lmsAuthoringHandlers } from "./lms-authoring"
import { lmsLearningHandlers } from "./lms-learning"
import { lmsImsccHandlers } from "./lms-imscc"
import { lmsInteractiveHandlers } from "./lms-interactive"
import { lmsSettingsHandlers } from "./lms-settings"
import { marksHandlers } from "./marks"
import { groupRatingHandlers } from "./group-rating"
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
import { myGroupHandlers } from "./my-group"
import { teachersHandlers } from "./teachers"
import { webSearchHandlers } from "./web-search"
import { workOffsMeHandlers } from "./work-offs-me"
import { excusesHandlers } from "./excuses"
import { workOffsStaffHandlers } from "./work-offs-staff"
import { adminWorkOffsHandlers } from "./work-offs-admin"
import { loginCuesHandlers } from "./login-cues"
import { appMapHandlers } from "./app-map"
import { clientConfigHandlers } from "./client-config"
import { botPostsHandlers } from "./bot-posts"
import { feedbackHandlers } from "./feedback"
import { facesHandlers } from "./faces"
import { adminFeedbackHandlers } from "./admin-feedback"

export { errorHandlers } from "./errors"
export { applyOutlineOps } from "./lms-authoring"
export { resetAssessments } from "./assessments"
export { resetTemporaryMarks } from "./temporary-marks"
export { resetMeSyncState } from "./me-sync"
export { certificatesImported, resetCertificatesState, setCertificatesStaffForbidden } from "./certificates"
export { resetAdminJobs } from "./admin-jobs"
export { personalTokenSecret, resetPersonalTokens } from "./id-personal-tokens"
export { resetAdminVault } from "./admin-vault"
export { resetFaces, setMyFace } from "./faces"
export { resetAdminKnowledge } from "./admin-knowledge"
export { resetAdminAiState } from "./admin-ai"
export { resetAiProjectsState } from "./ai-projects"
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
export { resetLessonSourcesState } from "./lesson-sources"
export { feedbackFixtures } from "./feedback"
export { resetStaffSubjectsState } from "./staff-subjects"
export { currentExcuses, resetExcusesState, seedExcuse } from "./excuses"
export { resetWorkOffsStaffState, seedStaffWorkOffs, staffWorkOffsOf } from "./work-offs-staff"
export { resetSubjectMaterialsState } from "./subject-materials"
export { resetTeacherContacts, resetTeacherPhotos, teacherPhotoUploads, type TeacherPhotoUpload } from "./teachers"
export { groupPhotoExports } from "./schedule"
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
  mcpActivityHandlers,
  adminKnowledgeHandlers,
  dashboardHandlers,
  filesHandlers,
  flashcardsHandlers,
  idAdminHandlers,
  idFactorsHandlers,
  idPersonalTokensHandlers,
  adminVaultHandlers,
  idHandlers,
  libraryHandlers,
  lessonSourcesHandlers,
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
  myGroupHandlers,
  webSearchHandlers,
  workOffsMeHandlers,
  excusesHandlers,
  workOffsStaffHandlers,
  adminWorkOffsHandlers,
  loginCuesHandlers,
  appMapHandlers,
  clientConfigHandlers,
  botPostsHandlers,
}

/**
 * Handlers for every endpoint of backend/openapi/openapi.json, matched against `TEST_API_URL`.
 * `compositionHandlers` come first so `GET /v1/admin/groups/stats` is not taken for `GET /v1/admin/groups/:id`.
 */
export const allHandlers = [
  ...sharingHandlers,
  ...compositionHandlers,
  ...oauthHandlers,
  ...idHandlers,
  ...idFactorsHandlers,
  ...idPersonalTokensHandlers,
  ...adminVaultHandlers,
  ...idAdminHandlers,
  ...registrationHandlers,
  ...loginCuesHandlers,
  ...appMapHandlers,
  ...clientConfigHandlers,
  ...botPostsHandlers,
  ...feedbackHandlers,
  ...adminFeedbackHandlers,
  ...scheduleHandlers,
  ...curriculumHandlers,
  ...meSyncHandlers,
  ...adminJobsHandlers,
  ...adminLogsHandlers,
  ...mcpActivityHandlers,
  ...adminKnowledgeHandlers,
  ...teachersHandlers,
  ...groupProgressHandlers,
  ...myGroupHandlers,
  ...temporaryMarksHandlers,
  ...classworkHandlers,
  ...workOffsMeHandlers,
  ...excusesHandlers,
  ...workOffsStaffHandlers,
  ...adminWorkOffsHandlers,
  ...marksHandlers,
  ...groupRatingHandlers,
  ...assessmentsHandlers,
  ...filesHandlers,
  ...lessonSourcesHandlers,
  ...linksHandlers,
  ...publicHandlers,
  ...notificationsHandlers,
  ...pushHandlers,
  ...broadcastsHandlers,
  ...certificatesHandlers,
  ...webSearchHandlers,
  ...adminAiHandlers,
  ...facesHandlers,
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
  ...honoursHandlers,
  ...studentCardHandlers,
]
export { notHeadStudentResponse } from "./group-progress"
export { resetSharing, sharingState } from "./sharing"
export { resetStudentCardTokens } from "./student-card"
