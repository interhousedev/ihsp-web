"use client"

import { getIdLoginCueNamesQuery, type LoginCueGroup, type LoginCueName } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { ErrorAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { useTr } from "../../shared/hooks/use-tr"

type RegisterCueNameStepProps = {
  group: LoginCueGroup
  onPicked: (cue: LoginCueName) => void
  onBack: () => void
}

/** "Pick your name", step 2: the names of the group. Picking one moves on to the EMIS password. */
export function RegisterCueNameStep({ group, onPicked, onBack }: RegisterCueNameStepProps) {
  const t = useTr()
  const names = useQuery(getIdLoginCueNamesQuery(group.group_id))
  const items = names.data ?? []

  return (
    <FlowCard title={t("register.cue.title")} description={t("register.cue.namesHint")}>
      <p className="text-muted-foreground -mt-2 text-sm">{group.name}</p>
      {!names.isPending && !names.isError && items.length === 0 ? (
        <p className="text-sm">{t("register.cue.empty")}</p>
      ) : null}
      <ul className="grid gap-2">
        {items.map((cue) => (
          <li key={cue.cue_id}>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-start text-base"
              onClick={() => onPicked(cue)}
            >
              {cue.display_name}
            </Button>
          </li>
        ))}
      </ul>
      <ErrorAlert error={names.error} />
      <Button type="button" variant="outline" className="h-11 text-base" onClick={onBack}>
        {t("register.cue.back")}
      </Button>
    </FlowCard>
  )
}
