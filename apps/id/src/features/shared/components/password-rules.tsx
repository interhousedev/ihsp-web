"use client"

import { IconCircle, IconCircleCheckFilled } from "@ihsp/ui"
import { useTr } from "../hooks/use-tr"
import { checkPassword, PASSWORD_RULES, type PasswordRule } from "../utils/password-rules"

const RULE_KEYS: Record<PasswordRule, string> = {
  length: "idCommon.passwordRules.length",
  digit: "idCommon.passwordRules.digit",
  upper: "idCommon.passwordRules.upper",
  lower: "idCommon.passwordRules.lower",
}

/** ID-4: the password rules, ticked off live as the user types. */
export function PasswordRules({ password }: { password: string }) {
  const t = useTr()
  const result = checkPassword(password)
  return (
    <ul className="grid gap-1 text-sm" aria-label={t("idCommon.passwordRules.title")}>
      {PASSWORD_RULES.map((rule) => (
        <li
          key={rule}
          data-met={result[rule]}
          className={`flex items-center gap-2 ${result[rule] ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
        >
          {result[rule] ? (
            <IconCircleCheckFilled className="size-4" aria-hidden />
          ) : (
            <IconCircle className="size-4" aria-hidden />
          )}
          <span>{t(RULE_KEYS[rule])}</span>
          <span className="sr-only">
            {t(result[rule] ? "idCommon.passwordRules.met" : "idCommon.passwordRules.notMet")}
          </span>
        </li>
      ))}
    </ul>
  )
}
