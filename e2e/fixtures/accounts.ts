/** Demo accounts created by `python -m app seed-demo` (backend/scripts/seed_demo.py, task I1 step 8). */

import type { AppKey } from "./env"

export type Account = {
  login: string
  password: string
  role: "student" | "teacher" | "admin"
  /** Recovery email: the second factor code of Administration is mailed here. */
  email?: string
  /** Apps this account may open (the login app refuses other clients with `auth/role-missing`). */
  apps: AppKey[]
}

/** Curator of 2TN2 (languages teacher); override with `E2E_CURATOR_LOGIN`. */
export const CURATOR: Account = {
  login: process.env.E2E_CURATOR_LOGIN ?? "karimova.nodira",
  password: "TeacherDemo1",
  role: "teacher",
  apps: ["id", "staff", "lms"],
}

/** Administration: password, then the one-time code the backend mails to Mailpit. */
export const ADMIN: Account = {
  login: "admin.ihsp",
  password: "AdminDemo1",
  email: "admin.ihsp@ihsu.uz",
  role: "admin",
  apps: ["id", "admin", "lms"],
}

/**
 * Student of 2TN2 (second year, head of the group), registered by the seed through the real registration use cases
 * with the fake EMIS account `student01`; the IHSP login is generated from the name.
 */
export const STUDENT: Account = {
  login: process.env.E2E_STUDENT_LOGIN ?? "abdullayev.alisher",
  password: "StudentDemo1",
  role: "student",
  apps: ["id", "sp", "lms"],
}

/** Student of 1TN1 (first year); EMIS account `student16`. */
export const STUDENT_FIRST_YEAR: Account = {
  login: "ergashev.gulnora",
  password: "StudentDemo1",
  role: "student",
  apps: ["id", "sp", "lms"],
}

/** Mathematics and Physics teacher of both groups (`<surname>.<name>`); override with `E2E_TEACHER_LOGIN`. */
export const TEACHER: Account = {
  login: process.env.E2E_TEACHER_LOGIN ?? "usmonov.bobur",
  password: "TeacherDemo1",
  role: "teacher",
  apps: ["id", "staff", "lms"],
}

/** The fake EMIS accepts `student01`…`student30` with this password (backend `FAKE_PASSWORD`). */
export const FAKE_EMIS_PASSWORD = "password"

/** Password a newly registered e2e student sets. */
export const REGISTERED_PASSWORD = "E2eStudent1"
