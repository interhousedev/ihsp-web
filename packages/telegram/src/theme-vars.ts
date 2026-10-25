/** The theme parameters we use, as exposed by `themeParams.state` (camelCase, `#rrggbb`). */
export type TelegramThemeColors = {
  bgColor?: string
  textColor?: string
  hintColor?: string
  linkColor?: string
  buttonColor?: string
  buttonTextColor?: string
  secondaryBgColor?: string
  sectionBgColor?: string
  sectionSeparatorColor?: string
  destructiveTextColor?: string
  accentTextColor?: string
}

/**
 * Maps Telegram's theme colors to the design tokens of `@ihsp/ui` (shadcn variables), so the app looks native in
 * the user's Telegram theme. Tokens without a matching Telegram color are left out and keep the app theme.
 */
export function themeParamsToCssVars(theme: TelegramThemeColors): Record<string, string> {
  const vars: Record<string, string> = {}
  const set = (name: string, value: string | undefined) => {
    if (value) vars[name] = value
  }
  const surface = theme.sectionBgColor ?? theme.secondaryBgColor ?? theme.bgColor
  const subtle = theme.secondaryBgColor ?? theme.bgColor

  set("--background", theme.bgColor)
  set("--foreground", theme.textColor)
  set("--card", surface)
  set("--card-foreground", theme.textColor)
  set("--popover", surface)
  set("--popover-foreground", theme.textColor)
  set("--primary", theme.buttonColor)
  set("--primary-foreground", theme.buttonTextColor)
  set("--secondary", subtle)
  set("--secondary-foreground", theme.textColor)
  set("--muted", subtle)
  set("--muted-foreground", theme.hintColor)
  set("--accent", subtle)
  set("--accent-foreground", theme.textColor)
  set("--destructive", theme.destructiveTextColor)
  set("--border", theme.sectionSeparatorColor)
  set("--input", theme.sectionSeparatorColor)
  set("--ring", theme.buttonColor)
  set("--sidebar", theme.bgColor)
  set("--sidebar-foreground", theme.textColor)
  set("--sidebar-primary", theme.buttonColor)
  set("--sidebar-primary-foreground", theme.buttonTextColor)
  set("--sidebar-accent", subtle)
  set("--sidebar-accent-foreground", theme.textColor)
  set("--sidebar-border", theme.sectionSeparatorColor)
  return vars
}
