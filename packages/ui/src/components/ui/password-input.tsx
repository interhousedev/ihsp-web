"use client"

import { useT } from "@ihsp/i18n"
import * as React from "react"
import { cn } from "../../lib/utils"
import { Icons } from "../icons"
import { Input } from "./input"

/**
 * A password field with an eye button that shows or hides what was typed. The button has an accessible name in
 * every language and a 44 px touch target; the input is 44 px high too, so the button fills the field's right edge.
 * It is `type="password"` again whenever the component mounts. Use it for every password the user types.
 */
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<typeof Input>, "type">) {
  const t = useT()
  const [visible, setVisible] = React.useState(false)
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("h-11 pr-11 text-base [&::-ms-reveal]:hidden", className)}
      />
      <button
        type="button"
        aria-label={visible ? t("common.hidePassword") : t("common.showPassword")}
        disabled={props.disabled}
        onClick={() => setVisible((value) => !value)}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-0 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-lg outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? <Icons.eyeOff aria-hidden className="size-5" /> : <Icons.eye aria-hidden className="size-5" />}
      </button>
    </div>
  )
}

export { PasswordInput }
