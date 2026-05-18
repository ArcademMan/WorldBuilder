import { createHashRouter } from "react-router-dom";

import { ProjectPickerPage } from "./features/project-picker/ProjectPickerPage";
import { ProjectShellPage } from "./features/project-shell/ProjectShellPage";

/**
 * Hash-based router: avoids issues with deep links under the Tauri
 * custom protocol on production builds. Keep this file as the single
 * source of truth for the app's navigation map.
 */
export const router = createHashRouter([
  { path: "/", element: <ProjectPickerPage /> },
  { path: "/project", element: <ProjectShellPage /> },
]);
