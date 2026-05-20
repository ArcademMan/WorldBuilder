import { Outlet } from "react-router-dom";

import { AppShell } from "../app-layout/AppShell";

import { HomeSidebar } from "./HomeSidebar";

export function HomeLayout() {
  return (
    <AppShell sidebar={<HomeSidebar />}>
      <Outlet />
    </AppShell>
  );
}
