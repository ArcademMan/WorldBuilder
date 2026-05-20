import { Outlet } from "react-router-dom";

import { AppShell } from "../app-layout/AppShell";

import { SettingsSidebar } from "./SettingsSidebar";

export function SettingsLayout() {
  return (
    <AppShell sidebar={<SettingsSidebar />}>
      <Outlet />
    </AppShell>
  );
}
