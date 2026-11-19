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
export type AdmissionBudget = Served["BudgetOut"]

// Opportunities
export type AdmissionOpportunityFields = Served["OpportunityFields"]
export type AdmissionMaterial = Served["MaterialIo"]
export type AdmissionDatedEvent = Served["DatedEventOut"]
export type AdmissionOpportunity = Served["OpportunityOut"] & { next_deadline?: string | null }
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
export type AdmissionOpportunityDetail = Served["OpportunityDetailOut"]
export type AdmissionOppComment = Served["OppCommentOut"]
export type AdmissionOppCommentIn = Schemas["OppCommentIn"]
export type AdmissionOppReportIn = Schemas["OppReportIn"]
export type AdmissionOppReport = Served["OppReportOut"]
export type AdmissionOppReportList = Served["OppReportListOut"]
export type AdmissionOrg = Served["OrgOut"]
export type AdmissionOrgList = Served["OrgListOut"]
export type AdmissionOrgIn = Schemas["OrgIn"]
export type AdmissionOrgPatch = Schemas["OrgPatch"]

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
export type AdmissionSuppCycle = Served["SuppCycleOut"]
export type AdmissionSuppPrompt = Served["SuppPromptOut"]
export type AdmissionSuppPromptIn = Schemas["SuppPromptIn"]
export type AdmissionCoachQuestions = Served["CoachQuestionsOut"]
export type AdmissionCoachExpansion = Served["CoachExpansionOut"]
export type AdmissionCoachOutline = Served["CoachOutlineOut"]
export type AdmissionCoachFeedback = Served["CoachFeedbackOut"]
export type AdmissionCoachCheck = Served["CoachCheckOut"]
export type AdmissionCoachCheckDimension = Served["CoachCheckDimensionOut"]

// Career
export type AdmissionCareerQuestion = Served[`${Adm}routes_career__QuestionOut`]
export type AdmissionCareerMajor = Served["MajorOut"]
export type AdmissionCareerPlan = Served["CareerPlanOut"]
export type AdmissionCareerSpikeIn = Schemas["SpikeIn"]

// Chooser
export type AdmissionFact = Served["FactOut"]
export type AdmissionSource = Served["SourceOut"]
export type AdmissionHighlight = Served["HighlightOut"]
export type AdmissionInstitutionDeadline = Served[`${Adm}routes_chooser__DeadlineOut`]
export type AdmissionFacet = Served["FacetOut"]
export type AdmissionStudyGroup = Served["StudyGroupOut"]
export type AdmissionInstitution = Served["InstitutionOut"] & { next_deadline?: string | null }
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
export type AdmissionDetailGroup = Served["DetailGroupOut"]
export type AdmissionDetailRow = Served["DetailRowOut"]
export type AdmissionImportanceFactor = Served["ImportanceFactorOut"]

// Catalog facts for international applicants (staff proposals and the agent API)
export type AdmissionFactSpec = Served["FactSpecOut"]
export type AdmissionFactSpecGroup = Served["FactSpecGroupOut"]
export type AdmissionFactSpecItem = Served["FactSpecItemOut"]
export type AdmissionFactSpecOption = Served["FactSpecOptionOut"]
export type AdmissionFactSpecPart = Served["FactSpecPartOut"]
export type AdmissionCatalogFactIn = Schemas["CatalogFactIn"]
export type AdmissionCatalogFact = Served["CatalogFactOut"]

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

// FAQ knowledge base and university chats
export type AdmissionKbArticle = Served["KbArticleOut"]
export type AdmissionKbArticleList = Served["KbArticlesOut"]
export type AdmissionKbArticleIn = Schemas["KbArticleIn"]
export type AdmissionKbArticlePatch = Schemas["KbArticlePatch"]
export type AdmissionUniChat = Served["UniChatOut"]
export type AdmissionDefaultPrompt = Served["DefaultPromptOut"]
export type AdmissionUniChatSuggestions = Served["UniChatSuggestionsOut"]
export type AdmissionLogoPatchIn = Schemas["LogoPatchIn"]

// Self-reported outcomes
export type AdmissionOutcome = Served["OutcomeOut"]
export type AdmissionOutcomeList = Served["OutcomeListOut"]
export type AdmissionOutcomeIn = Schemas["OutcomeIn"]
export type AdmissionOutcomePatch = Schemas["OutcomePatch"]
export type AdmissionOutcomeSummary = Served["OutcomeSummaryOut"]
export type AdmissionOutcomeTally = Served["OutcomeTallyOut"]
