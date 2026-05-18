import { invoke } from "@tauri-apps/api/core";

import type { RecentProject } from "../../types";

export function listRecents(): Promise<RecentProject[]> {
  return invoke<RecentProject[]>("list_recent_projects");
}

export function addRecent(recent: RecentProject): Promise<RecentProject[]> {
  return invoke<RecentProject[]>("add_recent_project", { recent });
}

export function removeRecent(path: string): Promise<RecentProject[]> {
  return invoke<RecentProject[]>("remove_recent_project", { path });
}
