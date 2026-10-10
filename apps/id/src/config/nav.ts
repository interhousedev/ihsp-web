import type { NavGroup } from "@ihsp/ui"
import {
  IconActivity,
  IconBrandTelegram,
  IconDeviceMobileMessage,
  IconDevices,
  IconKey,
  IconMail,
  IconPalette,
  IconPlugConnected,
  IconSchool,
  IconShieldLock,
  IconTrash,
} from "@ihsp/ui"
import type { Translate } from "../features/shared/hooks/use-tr"

/**
 * Sidebar of the security area. Items without `roles` are for everyone; EMIS and account deletion are for students.
 * Appearance (light / dark / system) is under Account for everybody.
 */
export function buildIdNav(t: Translate): NavGroup[] {
  return [
    {
      label: t("idNav.security"),
      items: [
        { title: t("idNav.overview"), url: "/security/", icon: IconShieldLock, match: "exact" },
        { title: t("idNav.password"), url: "/security/password/", icon: IconKey },
        { title: t("idNav.otp"), url: "/security/otp/", icon: IconDeviceMobileMessage },
        { title: t("idNav.telegram"), url: "/security/telegram/", icon: IconBrandTelegram },
        { title: t("idNav.email"), url: "/security/email/", icon: IconMail },
        { title: t("idNav.sessions"), url: "/security/sessions/", icon: IconDevices },
        { title: t("idNav.activity"), url: "/security/activity/", icon: IconActivity },
        { title: t("idNav.emis"), url: "/security/emis/", icon: IconSchool, roles: ["student"] },
      ],
    },
    {
      label: t("idNav.integrations"),
      items: [{ title: t("idNav.connectors"), url: "/connectors/", icon: IconPlugConnected }],
    },
    {
      label: t("idNav.account"),
      items: [
        { title: t("idNav.appearance"), url: "/appearance/", icon: IconPalette },
        { title: t("idNav.delete"), url: "/security/delete/", icon: IconTrash, roles: ["student"] },
      ],
    },
  ]
}
