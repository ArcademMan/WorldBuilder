import { invoke } from "@tauri-apps/api/core";

import type { Project } from "../../types";

export function createProject(path: string, name: string): Promise<Project> {
  return invoke<Project>("create_project", { path, name });
}

export function openProject(path: string): Promise<Project> {
  return invoke<Project>("open_project", { path });
}
