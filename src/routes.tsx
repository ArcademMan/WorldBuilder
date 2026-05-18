import { createHashRouter } from "react-router-dom";

import { EntryEditorPage } from "./features/entry-editor/EntryEditorPage";
import { ProjectPickerPage } from "./features/project-picker/ProjectPickerPage";
import { ProjectEmptyState } from "./features/project-shell/components/ProjectEmptyState";
import { ProjectShellPage } from "./features/project-shell/ProjectShellPage";
import { ProjectTemplatesPage } from "./features/templates/ProjectTemplatesPage";
import { TemplateEditorPage } from "./features/templates/TemplateEditorPage";
import { ProjectVocabulariesPage } from "./features/vocabularies/ProjectVocabulariesPage";

/**
 * Hash-based router: avoids issues with deep links under the Tauri
 * custom protocol on production builds. Keep this file as the single
 * source of truth for the app's navigation map.
 */
export const router = createHashRouter([
  { path: "/", element: <ProjectPickerPage /> },
  {
    path: "/project",
    element: <ProjectShellPage />,
    children: [
      { index: true, element: <ProjectEmptyState /> },
      { path: "entry/:id", element: <EntryEditorPage /> },
      { path: "templates", element: <ProjectTemplatesPage /> },
      { path: "templates/:id", element: <TemplateEditorPage /> },
      { path: "vocabularies", element: <ProjectVocabulariesPage /> },
    ],
  },
]);
