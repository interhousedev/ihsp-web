/** ID-4: at least 8 characters, one digit, one uppercase and one lowercase letter. */
export type PasswordRule = "length" | "digit" | "upper" | "lower"

export const PASSWORD_RULES: readonly PasswordRule[] = ["length", "digit", "upper", "lower"]

export function checkPassword(password: string): Record<PasswordRule, boolean> {
  return {
    length: password.length >= 8,
    digit: /\d/.test(password),
    upper: /\p{Lu}/u.test(password),
    lower: /\p{Ll}/u.test(password),
  }
}

export function isPasswordValid(password: string): boolean {
  const result = checkPassword(password)
  return PASSWORD_RULES.every((rule) => result[rule])
}
