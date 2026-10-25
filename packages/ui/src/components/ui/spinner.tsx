import { useT } from "@ihsp/i18n"

import { cn } from "../../lib/utils"
import { IconLoader } from "../icons"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const t = useT()
  return (
    <IconLoader
      data-slot="spinner"
      role="status"
      aria-label={t("common.loading")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
