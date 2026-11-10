import { z } from "zod"
import type { Translate } from "../hooks/use-tr"
import { isPasswordValid } from "./password-rules"

/** Zod building blocks with translated messages; every form builds its schema with these inside `useMemo`. */
export const requiredText = (t: Translate) => z.string().trim().min(1, t("idCommon.validation.required"))
export const emailText = (t: Translate) =>
  z
    .string()
    .trim()
    .pipe(z.email(t("idCommon.validation.email")))
export const codeText = (t: Translate) => z.string().regex(/^\d{6}$/, t("idCommon.validation.code"))
export const newPasswordText = (t: Translate) => z.string().refine(isPasswordValid, t("idCommon.validation.password"))

/** For `.refine(passwordsMatch, mismatchIssue(t))` on a schema with `password` and `confirm`. */
export const passwordsMatch = (value: { password: string; confirm: string }): boolean =>
  value.password === value.confirm

export const mismatchIssue = (t: Translate) => ({
  path: ["confirm"],
  message: t("idCommon.validation.mismatch"),
})
