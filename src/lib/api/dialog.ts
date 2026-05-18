import { open } from "@tauri-apps/plugin-dialog";

/**
 * Opens the OS folder picker and returns the selected absolute path,
 * or `null` if the user cancelled.
 */
export async function pickFolder(): Promise<string | null> {
  const selected = await open({ directory: true, multiple: false });
  return typeof selected === "string" ? selected : null;
}
