"use client";

import { logout, useAuthStore } from "@ihsp/auth";
import { usePlatformLinks } from "@ihsp/features-core";
import { UserMenu } from "@ihsp/ui";

/**
 * The profile menu with the links to the other IHSP platforms, shown only when someone is logged in on this host.
 * The viewer itself never starts a login (it has no `AuthProvider`), so for the public it renders nothing.
 */
export function ShareAccountMenu() {
  const user = useAuthStore((state) => state.user);
  const platforms = usePlatformLinks();
  if (!user) return null;

  return (
    <UserMenu
      name={`${user.last_name} ${user.first_name}`}
      subtitle={user.login}
      platforms={platforms}
      onLogout={() => void logout()}
    />
  );
}
