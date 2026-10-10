import type { AdminUser, AdminUserDetail, OauthClientItem, PlatformSettings } from "@ihsp/api"
import { auditItems, sessionItems, telegramAccounts } from "./id"
import { ids, persons } from "./world"

export const adminStudentUser: AdminUser = {
  id: ids.student,
  login: "brastilov.aleksey",
  first_name: persons.student.first_name,
  last_name: persons.student.last_name,
  middle_name: "Olegovich",
  roles: ["student"],
  status: "active",
  emis_status: "active",
  recovery_email: "aleksey@example.org",
  mail_suspended: false,
  created_at: "2026-09-03T07:00:00Z",
  last_login_at: "2026-10-07T03:00:00Z",
}

export const adminTeacherUser: AdminUser = {
  id: ids.teacherKalandarova,
  login: "kalandarova.gavxar",
  first_name: persons.kalandarova.first_name,
  last_name: persons.kalandarova.last_name,
  middle_name: null,
  roles: ["teacher"],
  status: "active",
  emis_status: null,
  recovery_email: "kalandarova@example.org",
  mail_suspended: false,
  created_at: "2026-08-28T10:00:00Z",
  last_login_at: "2026-10-07T02:45:00Z",
}

export const adminAdminUser: AdminUser = {
  id: ids.admin,
  login: "admin.ihsp",
  first_name: persons.admin.first_name,
  last_name: persons.admin.last_name,
  middle_name: null,
  roles: ["admin", "lms_admin"],
  status: "active",
  emis_status: null,
  recovery_email: "admin@example.org",
  mail_suspended: false,
  created_at: "2026-08-20T10:00:00Z",
  last_login_at: "2026-10-07T01:30:00Z",
}

export const adminBlockedUser: AdminUser = {
  id: ids.student2,
  login: "ismoilov.jasur",
  first_name: "Jasur",
  last_name: "Ismoilov",
  middle_name: null,
  roles: ["student"],
  status: "blocked",
  emis_status: "needs_reauth",
  recovery_email: null,
  mail_suspended: true,
  created_at: "2026-09-04T07:00:00Z",
  last_login_at: "2026-09-30T09:10:00Z",
}

export const adminUsers: AdminUser[] = [adminStudentUser, adminTeacherUser, adminAdminUser, adminBlockedUser]

export const adminTeachers: AdminUser[] = [
  adminTeacherUser,
  ...[
    { ...persons.rakhimov, login: "rakhimov.timur" },
    { ...persons.smirnova, login: "smirnova.elena" },
    { ...persons.yusupov, login: "yusupov.farrukh" },
    { ...persons.karimova, login: "karimova.dilnoza" },
  ].map(
    (teacher): AdminUser => ({
      ...adminTeacherUser,
      id: teacher.id,
      login: teacher.login,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
    }),
  ),
]

export const adminUserDetail: AdminUserDetail = {
  ...adminStudentUser,
  telegram: telegramAccounts,
  sessions: sessionItems,
  recent_audit: auditItems,
}

export const oauthClients: OauthClientItem[] = [
  { client_id: "sp", name: "Student portal", verified: true, dynamic: false, last_used_at: "2026-10-07T03:00:00Z" },
  { client_id: "staff", name: "Staff portal", verified: true, dynamic: false, last_used_at: "2026-10-07T02:45:00Z" },
  {
    client_id: "mcp-client-1",
    name: "Claude Desktop",
    verified: false,
    dynamic: true,
    last_used_at: "2026-10-06T16:40:00Z",
  },
]

export const resetPasswordResponse = {
  activation_url: "http://localhost:3001/activate/?token=reset-token-1",
}

export const teacherActivationUrl = "http://localhost:3001/activate/?token=teacher-token-1"

/** `GET /v1/admin/settings`: nothing saved yet, so the defaults. */
export const platformSettings: PlatformSettings = {
  school_name: "",
  support_contact: "",
  change_password_on_login: false,
  default_language: "ru",
  features: { notebooks: true, ai_assistant: true, lms: true, change_password_on_login: false },
}
