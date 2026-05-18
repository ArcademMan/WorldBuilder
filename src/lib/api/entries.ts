import { invoke } from "@tauri-apps/api/core";

import type { Entry } from "../../types";

export function createEntry(
  projectPath: string,
  templateId: string,
  name: string,
): Promise<Entry> {
  return invoke<Entry>("create_entry", { projectPath, templateId, name });
}

export function listEntries(projectPath: string): Promise<Entry[]> {
  return invoke<Entry[]>("list_entries", { projectPath });
}

export function readEntry(projectPath: string, id: string): Promise<Entry> {
  return invoke<Entry>("read_entry", { projectPath, id });
}

export function saveEntry(projectPath: string, entry: Entry): Promise<Entry> {
  return invoke<Entry>("save_entry", { projectPath, entry });
}

export function deleteEntry(projectPath: string, id: string): Promise<void> {
  return invoke<void>("delete_entry", { projectPath, id });
}
