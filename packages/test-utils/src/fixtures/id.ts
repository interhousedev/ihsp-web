import type {
  ActivationInfo,
  AuditItem,
  ConsentInfo,
  Connector,
  LoginInfo,
  LoginResult,
  ScopeCatalog,
  SessionItem,
  TelegramAccount,
  UserMe,
  UserPreferences,
} from "@ihsp/api"
import { FIXTURE_NOW, ids, persons } from "./world"

export const userPreferences: UserPreferences = {
  locale: "en",
  theme: "light",
  marks_enabled: true,
  marks_types: ["lesson", "midterm", "final"],
  marks_values: [2, 3, 4, 5],
  marks_subject_ids: null,
  alerts_drops: true,
  alerts_gpa_below: null,
  alerts_semester_mark_below: null,
  alerts_mark_below: null,
  lessons_links_lead_min: 5,
  lessons_prompt_enabled: true,
  mail_forward_to_telegram: true,
  notify_push: true,
  today_cards: ["now", "timeline", "due", "marks", "semester", "announcements", "alerts"],
  onboarding_dismissed: [],
  seen_marks_at: null,
}

export const telegramAccounts: TelegramAccount[] = [
  {
    telegram_user_id: 100200300,
    username: "aleksey_b",
    otp_delivery: true,
    blocked: false,
    linked_at: "2026-09-03T07:30:00Z",
  },
]

/** The demo student Brastilov Aleksey of group 2TN2. */
export const userMe: UserMe = {
  id: ids.student,
  login: "brastilov.aleksey",
  first_name: persons.student.first_name,
  last_name: persons.student.last_name,
  middle_name: "Olegovich",
  roles: ["student"],
  status: "active",
  recovery_email: "aleksey@example.org",
  otp_enabled: false,
  otp_via_email: false,
  emis_status: "active",
  mailbox: "brastilov.aleksey@mail.ihsu.uz",
  preferences: userPreferences,
  telegram: telegramAccounts,
}

/** The demo teacher Kalandarova Gavxar. */
export const teacherMe: UserMe = {
  ...userMe,
  id: ids.teacherKalandarova,
  login: "kalandarova.gavxar",
  first_name: persons.kalandarova.first_name,
  last_name: persons.kalandarova.last_name,
  middle_name: null,
  roles: ["teacher"],
  recovery_email: "kalandarova@example.org",
  otp_enabled: true,
  emis_status: null,
  mailbox: "kalandarova.gavxar@mail.ihsu.uz",
  telegram: [],
}

/** The demo administrator `admin.ihsp` (password and OTP are required in the real flow). */
export const adminMe: UserMe = {
  ...userMe,
  id: ids.admin,
  login: "admin.ihsp",
  first_name: persons.admin.first_name,
  last_name: persons.admin.last_name,
  middle_name: null,
  roles: ["admin", "lms_admin"],
  recovery_email: "admin@example.org",
  otp_enabled: true,
  emis_status: null,
  mailbox: "admin.ihsp@mail.ihsu.uz",
  telegram: [],
}

export const loginInfo: LoginInfo = {
  client_id: "sp",
  client_name: "Student portal",
  skip: false,
  requires_second_factor: false,
  redirect_to: null,
}

/** Password accepted: follow `redirect_to`. */
export const loginResultRedirect: LoginResult = {
  redirect_to: "http://localhost:4444/oauth2/auth?login_verifier=test",
  second_factor: null,
}

/** Password accepted, second factor required. */
export const loginResultSecondFactor: LoginResult = {
  redirect_to: null,
  second_factor: { method: "otp", ticket: "ticket-1", channels: ["telegram", "email"] },
}

export const consentInfo: ConsentInfo = {
  client_id: "mcp-client-1",
  client_name: "Claude Desktop",
  verified: false,
  redirect_domain: "claude.ai",
  server: "student",
  requested_scopes: ["schedule:read", "marks:read"],
  requires_otp: false,
  redirect_to: null,
}

/** The scope catalog of `GET /v1/id/mcp-scopes` as the backend serves it (README MCP-8). */
export const scopeCatalog: ScopeCatalog = {
  servers: [
    {
      server: "student",
      roles: ["student"],
      scopes: [
        { scope: "schedule:read", tools: ["get_schedule", "get_my_subjects", "get_subject_lessons"] },
        { scope: "homework:read", tools: ["get_homework"] },
        { scope: "marks:read", tools: ["get_marks", "get_results"] },
        { scope: "attendance:read", tools: ["get_attendance"] },
        { scope: "materials:read", tools: ["get_lesson_materials"] },
        { scope: "files:read", tools: ["list_files", "read_file", "search_files"] },
        { scope: "flashcards:read", tools: ["list_flashcard_sets", "get_flashcard_set"] },
        { scope: "flashcards:write", tools: ["create_flashcard_set", "add_flashcards", "update_flashcard"] },
      ],
      presets: [
        { key: "study-planner", scopes: ["schedule:read", "homework:read", "materials:read"] },
        { key: "grades", scopes: ["marks:read", "attendance:read"] },
        { key: "revision", scopes: ["materials:read", "files:read", "flashcards:read", "flashcards:write"] },
      ],
    },
    {
      server: "lms",
      roles: ["admin", "lms_admin", "student", "teacher"],
      scopes: [
        {
          scope: "lms.courses.read",
          tools: ["list_courses", "get_course", "get_step", "list_pending_changes", "list_versions", "list_attempts"],
        },
        { scope: "lms.courses.write", tools: ["create_course", "update_course"] },
        { scope: "lms.courses.delete", tools: ["delete_course"] },
        {
          scope: "lms.modules.write",
          tools: [
            "create_module",
            "update_module",
            "delete_module",
            "create_section",
            "create_step",
            "update_step",
            "delete_step",
            "add_text_block",
            "add_test_block",
            "add_question",
            "add_flashcards_block",
          ],
        },
      ],
      presets: [
        { key: "course-reviewer", scopes: ["lms.courses.read"] },
        { key: "module-editor", scopes: ["lms.courses.read", "lms.modules.write"] },
        { key: "course-author", scopes: ["lms.courses.read", "lms.courses.write", "lms.modules.write"] },
        {
          key: "course-manager",
          scopes: ["lms.courses.read", "lms.courses.write", "lms.courses.delete", "lms.modules.write"],
        },
      ],
    },
    {
      server: "admin",
      roles: ["admin"],
      scopes: [
        { scope: "people:read", tools: ["search_users", "get_student", "list_teachers"] },
        { scope: "groups:read", tools: ["list_groups", "get_group"] },
        { scope: "timetable:read", tools: ["get_timetable", "list_lessons"] },
        { scope: "attendance:read", tools: ["attendance_stats", "missing_attendance"] },
        { scope: "broadcasts:read", tools: ["list_broadcasts"] },
        { scope: "audit:read", tools: ["audit_log", "sync_status"] },
      ],
      presets: [
        { key: "attendance-analyst", scopes: ["attendance:read", "groups:read"] },
        { key: "timetable-viewer", scopes: ["timetable:read", "groups:read"] },
      ],
    },
  ],
}

export const sessionItems: SessionItem[] = [
  {
    id: "00000007-0000-4000-8000-000000000001",
    ip: "10.0.0.5",
    user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
    amr: ["pwd"],
    last_seen_at: FIXTURE_NOW,
    current: true,
  },
  {
    id: "00000007-0000-4000-8000-000000000002",
    ip: "10.0.0.17",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0",
    amr: ["pwd"],
    last_seen_at: "2026-10-05T10:20:00Z",
    current: false,
  },
]

export const auditItems: AuditItem[] = [
  {
    id: "0000000a-0000-4000-8000-000000000001",
    type: "auth.login",
    ip: "10.0.0.5",
    user_agent: "Mozilla/5.0 (iPhone)",
    actor: null,
    created_at: "2026-10-07T03:00:00Z",
    metadata: { client_id: "sp" },
  },
  {
    id: "0000000a-0000-4000-8000-000000000002",
    type: "auth.password_changed",
    ip: "10.0.0.17",
    user_agent: "Mozilla/5.0 (Windows NT 10.0)",
    actor: null,
    created_at: "2026-09-20T12:00:00Z",
    metadata: {},
  },
  {
    id: "0000000a-0000-4000-8000-000000000003",
    type: "admin.user_blocked",
    ip: "10.0.0.2",
    user_agent: null,
    actor: persons.admin,
    created_at: "2026-09-10T08:00:00Z",
    metadata: { reason: "test" },
  },
]

export const connectors: Connector[] = [
  {
    id: "0000000b-0000-4000-8000-000000000001",
    name: "Claude Desktop",
    server: "student",
    scopes: ["schedule:read", "marks:read"],
    course_ids: null,
    kind: "token",
    token_prefix: "ihsp_ab12",
    created_at: "2026-09-15T09:00:00Z",
    last_used_at: "2026-10-06T16:40:00Z",
    expires_at: "2026-12-14T09:00:00Z",
    revoked_at: null,
  },
]

/** Plain-text token returned once by `POST /v1/id/me/connectors`. */
export const connectorToken = "ihsp_ab12cdef34567890abcdef1234567890"

export const activationInfo: ActivationInfo = {
  first_name: persons.kalandarova.first_name,
  last_name: persons.kalandarova.last_name,
  login: "kalandarova.gavxar",
  requires_otp: true,
}
