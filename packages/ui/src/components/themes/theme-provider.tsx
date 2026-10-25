"use client"

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

/** The light/dark switch hook of next-themes, so apps need no direct import. */
export { useTheme } from "next-themes"

/** Light/dark mode (class on <html>, stored in localStorage by next-themes). */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export default ThemeProvider
