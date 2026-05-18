import { open } from "@tauri-apps/plugin-dialog";

/**
 * Opens the OS folder picker and returns the selected absolute path,
 * or `null` if the user cancelled.
 */
export async function pickFolder(): Promise<string | null> {
  const selected = await open({ directory: true, multiple: false });
  return typeof selected === "string" ? selected : null;
}

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"];

/** Opens the OS image picker; returns absolute path(s) or null/empty. */
export async function pickImage(
  multiple = false,
): Promise<string[] | null> {
  const selected = await open({
    multiple,
    filters: [{ name: "Image", extensions: IMAGE_EXTENSIONS }],
  });
  if (selected === null) return null;
  return Array.isArray(selected) ? selected : [selected];
}
