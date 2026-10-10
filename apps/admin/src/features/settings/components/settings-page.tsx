"use client"

import {
  getAdminSettingsQuery,
  keys,
  putAdminSettings,
  type PlatformLocale,
  type PlatformSettings,
  type PlatformSettingsBody,
} from "@ihsp/api"
import { AppLockSection } from "@ihsp/features-core/pwa/lock"
import { useT } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { CheckField } from "../../shared/components/check-field"
import { LabeledField } from "../../shared/components/labeled-field"
import { QueryState } from "../../shared/components/query-state"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

const LOCALES: readonly PlatformLocale[] = ["uz", "ru", "en"]
const SCHOOL_NAME_MAX = 120
const SUPPORT_CONTACT_MAX = 255

function toForm(settings: PlatformSettings): PlatformSettingsBody {
  return {
    school_name: settings.school_name,
    support_contact: settings.support_contact,
    change_password_on_login: settings.change_password_on_login,
    default_language: settings.default_language,
  }
}

function SettingsForm({ settings }: { settings: PlatformSettings }) {
  const t = useT("settings")
  const [form, setForm] = useState<PlatformSettingsBody>(toForm(settings))
  const saved = toForm(settings)
  const dirty = (Object.keys(saved) as (keyof PlatformSettingsBody)[]).some((key) => form[key] !== saved[key])

  const save = useAdminMutation({
    mutationFn: () =>
      putAdminSettings({
        ...form,
        school_name: form.school_name.trim(),
        support_contact: form.support_contact.trim(),
      }),
    invalidate: [keys.admin.settings()],
    success: t("saved"),
    onSuccess: (data) => setForm(toForm(data)),
  })

  const featureNames = Object.keys(settings.features).sort()
  return (
    <PageContainer title={t("title")}>
      <form
        className="grid max-w-2xl gap-6"
        onSubmit={(event) => {
          event.preventDefault()
          if (dirty) save.mutate()
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("school")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <LabeledField label={t("schoolName")} htmlFor="settings-school-name">
              <Input
                id="settings-school-name"
                value={form.school_name}
                maxLength={SCHOOL_NAME_MAX}
                className={TOUCH}
                onChange={(event) => setForm({ ...form, school_name: event.target.value })}
              />
            </LabeledField>
            <LabeledField label={t("supportContact")} htmlFor="settings-support-contact">
              <Input
                id="settings-support-contact"
                value={form.support_contact}
                maxLength={SUPPORT_CONTACT_MAX}
                className={TOUCH}
                onChange={(event) => setForm({ ...form, support_contact: event.target.value })}
              />
            </LabeledField>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("defaults")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <LabeledField label={t("defaultLanguage")} htmlFor="settings-default-language">
              <SelectField
                id="settings-default-language"
                value={form.default_language}
                onChange={(value) => setForm({ ...form, default_language: value as PlatformLocale })}
                options={LOCALES.map((locale) => ({ value: locale, label: t(`languages.${locale}`) }))}
              />
            </LabeledField>
            <CheckField
              checked={form.change_password_on_login}
              onChange={(checked) => setForm({ ...form, change_password_on_login: checked })}
              label={t("changePasswordOnLogin")}
            />
            <p className="text-muted-foreground text-xs">
              {settings.features.change_password_on_login ? t("changePasswordFlagOn") : t("changePasswordFlagOff")}
            </p>
          </CardContent>
        </Card>
        <div>
          <Button type="submit" className={TOUCH} disabled={!dirty || save.isPending}>
            {t("save")}
          </Button>
        </div>
      </form>
      <section className="flex max-w-2xl flex-col gap-2">
        <h2 className="text-base font-semibold">{t("features")}</h2>
        <ul className="flex flex-wrap gap-2">
          {featureNames.map((name) => (
            <li key={name}>
              <Badge variant={settings.features[name] ? "secondary" : "outline"}>
                {name}: {settings.features[name] ? t("on") : t("off")}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
      <div className="max-w-2xl">
        <AppLockSection />
      </div>
    </PageContainer>
  )
}

/** Platform settings (admin): the school info and safe defaults that change without a deploy, plus the feature flags. */
export function SettingsPage() {
  const query = useQuery(getAdminSettingsQuery())
  return <QueryState query={query} rows={4}>{(settings) => <SettingsForm settings={settings} />}</QueryState>
}
