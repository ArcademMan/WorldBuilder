import { invoke } from "@tauri-apps/api/core";

import type { Template } from "../../types";

export function listTemplates(projectPath: string): Promise<Template[]> {
  return invoke<Template[]>("list_templates", { projectPath });
}

export function readTemplate(projectPath: string, id: string): Promise<Template> {
  return invoke<Template>("read_template", { projectPath, id });
}
