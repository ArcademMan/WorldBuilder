import { invoke } from "@tauri-apps/api/core";

export function getActiveProjectPath(): Promise<string | null> {
  return invoke<string | null>("get_active_project_path");
}

export function setActiveProjectPath(path: string): Promise<void> {
  return invoke<void>("set_active_project_path", { path });
}

export function clearActiveProjectPath(): Promise<void> {
  return invoke<void>("clear_active_project_path");
}
