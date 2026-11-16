// Admission office (`/v1/admission/*`): generated shapes of application reviews, opportunities, essays, career,
// the college chooser, deadlines and the staff caseload.
import type { components } from "../generated/openapi"
import type { components as served } from "../generated/openapi-served"

/** Request bodies: optional where the server has a default. */
type Schemas = components["schemas"]
/** Responses: fields with a server default are always present. */
type Served = served["schemas"]
type Adm = "app__interfaces__http__v1__admission__"

// Application review
export type AdmissionReview = Served["AppReviewOut"]
export type AdmissionReviewList = Served["AppReviewListOut"]

// Opportunities
export type AdmissionOpportunityFields = Served["OpportunityFields"]
export type AdmissionMaterial = Served["MaterialIo"]
export type AdmissionDatedEvent = Served["DatedEventOut"]
export type AdmissionOpportunity = Served["OpportunityOut"]
export type AdmissionOpportunityList = Served["OpportunityListOut"]
export type AdmissionTaxonomy = Served["TaxonomyOut"]
export type AdmissionTaxonomyField = Served["TaxonomyFieldOut"]
export type AdmissionTaxonomySubfield = Served["TaxonomySubfieldOut"]
export type AdmissionTaxonomySubject = Served["TaxonomySubjectOut"]
export type AdmissionTaxonomyNode = Served["TaxonomyNodeOut"]
export type AdmissionTaxonomyNodeIn = Schemas["TaxonomyNodeIn"]
export type AdmissionSubmission = Served["SubmissionOut"]
export type AdmissionSubmissionList = Served["SubmissionListOut"]
export type AdmissionSubmissionIn = Schemas["SubmissionIn"]
export type AdmissionSubmissionReviewIn = Schemas[`${Adm}schemas_opportunities__ReviewIn`]
export type AdmissionPlanEntry = Served["PlanEntryOut"]
export type AdmissionPlanEntryIn = Schemas["PlanEntryIn"]
export type AdmissionPlanDeadline = Served[`${Adm}schemas_opportunities__DeadlineOut`]
export type AdmissionPlanAnalytics = Served["AnalyticsOut"]
export type AdmissionPlan = Served["PlanOut"]
export type AdmissionAiPlan = Served["AiPlanOut"]
export type AdmissionAiPlanEnvelope = Served["AiPlanEnvelope"]
export type AdmissionAiPlanIn = Schemas["AiPlanIn"]

// Essays
export type AdmissionEssay = Served["EssayOut"]
export type AdmissionEssaySummary = Served["EssaySummaryOut"]
export type AdmissionEssayIn = Schemas["EssayIn"]
export type AdmissionEssayPatch = Schemas["EssayPatchIn"]
export type AdmissionEssayLink = Served["EssayLinkIO"]
export type AdmissionPlanSection = Served["PlanSectionIO"]
export type AdmissionEssayVersion = Served["EssayVersionOut"]
export type AdmissionSharedEssay = Served["SharedEssayOut"]
export type AdmissionIdea = Served["IdeaOut"]
export type AdmissionIdeaIn = Schemas["IdeaIn"]
export type AdmissionIdeaPatch = Schemas["IdeaPatchIn"]
export type AdmissionCoachQuestions = Served["CoachQuestionsOut"]
export type AdmissionCoachExpansion = Served["CoachExpansionOut"]
export type AdmissionCoachOutline = Served["CoachOutlineOut"]
export type AdmissionCoachFeedback = Served["CoachFeedbackOut"]

// Career
export type AdmissionCareerQuestion = Served[`${Adm}routes_career__QuestionOut`]
export type AdmissionCareerMajor = Served["MajorOut"]
export type AdmissionCareerPlan = Served["CareerPlanOut"]
export type AdmissionCareerSpikeIn = Schemas["SpikeIn"]

// Chooser
export type AdmissionFact = Served["FactOut"]
export type AdmissionInstitution = Served["InstitutionOut"]
export type AdmissionInstitutionPage = Served["InstitutionPageOut"]
export type AdmissionMatch = Served["MatchOut"]
export type AdmissionMatchList = Served["MatchListOut"]
export type AdmissionMatchStatus = NonNullable<AdmissionMatch["status"]>
export type AdmissionMatchDecision = Schemas["DecisionIn"]["decision"]
export type AdmissionChances = Served["ChancesOut"]
export type AdmissionChanceFactor = Served["ChanceFactorOut"]
export type AdmissionChanceSimulation = Served["ChanceSimulationOut"]
export type AdmissionPreferences = Served["PreferencesOut"]
export type AdmissionPreferenceAnswers = Schemas["PreferenceAnswersIO"]
export type AdmissionMentoring = Served["MentoringOut"]
export type AdmissionSummary = Served["SummaryOut"]
export type AdmissionScholarship = Served["ScholarshipOut"]
export type AdmissionEstimate = Served["EstimateOut"]
export type AdmissionAffordability = Served["AffordabilityOut"]
export type AdmissionListEntry = Served["ListEntryOut"]
export type AdmissionListAddIn = Schemas["ListAddIn"]
export type AdmissionListPatchIn = Schemas["ListPatchIn"]

// Deadlines
export type AdmissionMilestone = Served[`${Adm}routes_documents__MilestoneOut`]
export type AdmissionDeadline = Served[`${Adm}routes_documents__DeadlineOut`]
export type AdmissionDeadlineIn = Schemas["DeadlineIn"]
export type AdmissionDeadlinePatchIn = Schemas["DeadlinePatchIn"]
export type AdmissionReminderPrefs = Served["PrefsOut"]

// Staff
export type AdmissionCaseloadItem = Served["CaseloadItemOut"]
export type AdmissionSavedView = Served["SavedViewOut"]
export type AdmissionSavedViewIn = Schemas["SavedViewIn"]
export type AdmissionAssignment = Served[`${Adm}schemas_staff__AssignmentOut`]
export type AdmissionAssignmentIn = Schemas["AssignmentIn"]
export type AdmissionStudentProfile = Served["ProfileOut"]
export type AdmissionStudentWords = Served["WordsOut"]
export type AdmissionStudentAlignment = Served["AlignmentOut"]
export type AdmissionStudentCourse = Served["CourseOut"]
export type AdmissionCoveringOfficer = Served["CoveringOfficerOut"]
export type AdmissionAssignableUser = Served["AssignableUserOut"]
export type AdmissionAssignableRole = Served["AssignableRoleOut"]

// Tasks
export type AdmissionTask = Served["TaskOut"]
export type AdmissionTasks = Served["TasksOut"]
export type AdmissionTaskIn = Schemas["TaskIn"]
export type AdmissionTaskPatch = Schemas["TaskPatch"]
export type AdmissionTaskAcceptIn = Schemas[`${Adm}routes_tasks__AcceptIn`]

// Test scores
export type AdmissionScoreCatalog = Served["ScoreCatalogOut"]
export type AdmissionScoreTest = Served["ScoreTestOut"]
export type AdmissionScoreEntry = Served["ScoreEntryOut"]
export type AdmissionScoreEntryIn = Schemas["ScoreEntryIn"]
export type AdmissionScoreOverview = Served["ScoreOverviewOut"]

// Readiness
export type AdmissionReadiness = Served["ReadinessOut"]
export type AdmissionReadinessWeights = Served["ReadinessWeightsBody"]

// Assistant
export type AdmissionAssistantMessageIn = Schemas["MessageIn"]
export type AdmissionAssistantReply = Served["ReplyOut"]
export type AdmissionAssistantThreads = Served["ThreadsOut"]
export type AdmissionAssistantThread = Served["ThreadDetailOut"]
export type AdmissionAssistantSuggestions = Served[`${Adm}routes_assistant__SuggestionsOut`]

// Items
export type AdmissionItem = Served["ItemOut"]
export type AdmissionItemList = Served["ItemListOut"]
export type AdmissionItemIn = Schemas["ItemCreateIn"]
export type AdmissionItemPatch = Schemas["ItemPatchIn"]
export type AdmissionItemReview = Served["ReviewOut"]
export type AdmissionItemInterview = Served["InterviewOut"]
export type AdmissionItemInterviewIn = Schemas["InterviewIn"]
export type AdmissionItemMetricIn = Schemas["MetricIn"]
export type AdmissionItemMetrics = Served["MetricsOut"]

// Consent and privacy
export type AdmissionConsent = Served["ConsentOut"]
export type AdmissionPurposeList = Served["PurposeListOut"]
export type AdmissionAudit = Served["AuditOut"]
export type AdmissionDataExport = Served["DataExportOut"]
export type AdmissionErased = Served["ErasedOut"]
