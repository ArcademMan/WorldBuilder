import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";

import { pickFolder } from "./dialog";

export type ExportFile = { name: string; content: string };

export function writeTextFile(path: string, content: string): Promise<void> {
  return invoke<void>("write_text_file", { path, content });
}

export function writeTextFiles(dir: string, files: ExportFile[]): Promise<void> {
  return invoke<void>("write_text_files", { dir, files });
}

/** Opens the OS save dialog and returns the chosen file path, or null. */
export async function pickSaveFile(
  defaultName: string,
  extension: string,
  extLabel: string,
): Promise<string | null> {
  const selected = await save({
    defaultPath: defaultName,
    filters: [{ name: extLabel, extensions: [extension] }],
  });
  return selected ?? null;
}

/** Re-exported for convenience: export-folder picker. */
export const pickExportFolder = pickFolder;
