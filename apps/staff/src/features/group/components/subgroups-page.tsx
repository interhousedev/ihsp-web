"use client"

import { getStaffGroupQuery, type GroupItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Checkbox, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { QueryState } from "../../shared/components/query-state"
import { useSaveSubgroups } from "../hooks/use-save-subgroups"
import { assign, effectiveSubgroup, sortForAssignment, toBody, type Pending, type Subgroup } from "../utils/subgroups"
import { GroupScope } from "./group-scope"
import { SubgroupRow } from "./subgroup-row"

function SubgroupEditor({ group }: { group: GroupItem }) {
  const t = useT("group.subgroups")
  const errorMessage = useErrorMessage()
  const query = useQuery(getStaffGroupQuery(group.id))
  const save = useSaveSubgroups(group.id)
  const [pending, setPending] = useState<Pending>({})
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const changes = Object.keys(pending).length

  function submit() {
    save.mutate(toBody(pending), {
      onSuccess: () => {
        setPending({})
        setSelected(new Set())
        toast.success(t("saved"))
      },
    })
  }

  return (
    <QueryState
      query={query}
      rows={4}
      isEmpty={(detail) => sortForAssignment(detail.students).length === 0}
      emptyText={t("empty")}
    >
      {(detail) => {
        const students = sortForAssignment(detail.students)
        const allSelected = students.length > 0 && students.every((student) => selected.has(student.user_id))

        function bulk(subgroup: Subgroup) {
          setPending((current) => assign(current, detail.students, [...selected], subgroup))
          setSelected(new Set())
        }

        return (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
              <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                <Checkbox
                  checked={allSelected}
                  aria-label={t("selectAll")}
                  onCheckedChange={(checked) =>
                    setSelected(checked === true ? new Set(students.map((student) => student.user_id)) : new Set())
                  }
                />
                {selected.size > 0 ? t("selected", { count: selected.size }) : t("selectAll")}
              </label>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("bulk")}>
                <Button
                  variant="outline"
                  className="min-h-11 md:min-h-8"
                  disabled={selected.size === 0}
                  onClick={() => bulk(1)}
                >
                  {t("assignTo", { number: 1 })}
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 md:min-h-8"
                  disabled={selected.size === 0}
                  onClick={() => bulk(2)}
                >
                  {t("assignTo", { number: 2 })}
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-11 md:min-h-8"
                  disabled={selected.size === 0}
                  onClick={() => bulk(null)}
                >
                  {t("clearSubgroup")}
                </Button>
              </div>
            </div>
            <ul className="flex flex-col gap-2">
              {students.map((student) => (
                <SubgroupRow
                  key={student.user_id}
                  student={student}
                  subgroup={effectiveSubgroup(student, pending)}
                  changed={student.user_id in pending}
                  selected={selected.has(student.user_id)}
                  onSelect={(isSelected) =>
                    setSelected((current) => {
                      const next = new Set(current)
                      if (isSelected) next.add(student.user_id)
                      else next.delete(student.user_id)
                      return next
                    })
                  }
                  onChange={(subgroup) =>
                    setPending((current) => assign(current, detail.students, [student.user_id], subgroup))
                  }
                />
              ))}
            </ul>
            {save.isError ? (
              <p role="alert" className="text-destructive text-sm">
                {errorMessage(save.error)}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button className="min-h-11 md:min-h-8" disabled={changes === 0 || save.isPending} onClick={submit}>
                {save.isPending ? t("saving") : t("save")}
              </Button>
              {changes > 0 ? (
                <>
                  <span className="text-muted-foreground text-sm">{t("unsaved", { count: changes })}</span>
                  <Button variant="ghost" className="min-h-11 md:min-h-8" onClick={() => setPending({})}>
                    {t("discard")}
                  </Button>
                </>
              ) : null}
            </div>
          </>
        )
      }}
    </QueryState>
  )
}

/** My group → Subgroups (STF-12, ACA-2, UF-STF-10): assign each student to subgroup 1 or 2, one by one or in bulk. */
export function SubgroupsPage() {
  const t = useT("group.subgroups")
  return (
    <PageContainer title={t("title")}>
      <GroupScope>{(group) => <SubgroupEditor key={group.id} group={group} />}</GroupScope>
    </PageContainer>
  )
}
