import { invoke } from "@tauri-apps/api/core";

import type { Template } from "../../types";

export function listTemplates(projectPath: string): Promise<Template[]> {
  return invoke<Template[]>("list_templates", { projectPath });
}

export function readTemplate(projectPath: string, id: string): Promise<Template> {
  return invoke<Template>("read_template", { projectPath, id });
}

/**
 * Upsert. For a brand-new template the UI is responsible for generating
 * the id (UUID); for an existing one pass its current id.
 * Returns the canonical template as re-read from the DB.
 */
export function saveTemplate(
  projectPath: string,
  template: Template,
): Promise<Template> {
  return invoke<Template>("save_template", { projectPath, template });
}

export function deleteTemplate(projectPath: string, id: string): Promise<void> {
  return invoke<void>("delete_template", { projectPath, id });
}
