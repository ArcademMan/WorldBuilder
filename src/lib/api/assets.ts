import { invoke } from "@tauri-apps/api/core";

import type { Asset, AssetData } from "../../types";

export function importAsset(
  projectPath: string,
  sourcePath: string,
): Promise<Asset> {
  return invoke<Asset>("import_asset", { projectPath, sourcePath });
}

/**
 * Returns the asset's raw bytes + mime. The caller is expected to wrap
 * them in a Blob and URL.createObjectURL for use as an <img> src.
 *
 * Tauri serializes Vec<u8> as a JSON array of numbers, so we coerce
 * into a Uint8Array on this side.
 */
export async function readAsset(
  projectPath: string,
  id: string,
): Promise<{ mimeType: string; bytes: Uint8Array }> {
  const raw = await invoke<AssetData>("read_asset", { projectPath, id });
  return {
    mimeType: raw.mimeType,
    bytes: new Uint8Array(raw.bytes),
  };
}

export function deleteAsset(projectPath: string, id: string): Promise<void> {
  return invoke<void>("delete_asset", { projectPath, id });
}
