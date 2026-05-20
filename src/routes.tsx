import { createHashRouter, Navigate } from "react-router-dom";

import { RootShell } from "./features/app-layout/RootShell";
import { EntryEditorPage } from "./features/entry-editor/EntryEditorPage";
import { ExportPage } from "./features/export/ExportPage";
import { HomeLayout } from "./features/project-picker/HomeLayout";
import { ProjectPickerPage } from "./features/project-picker/ProjectPickerPage";
import { ProjectEmptyState } from "./features/project-shell/components/ProjectEmptyState";
import { ProjectLayout } from "./features/project-shell/ProjectLayout";
import { AppearanceSection } from "./features/settings/AppearanceSection";
import { SettingsLayout } from "./features/settings/SettingsLayout";
import { ThemeSection } from "./features/settings/ThemeSection";
import { ProjectTemplatesPage } from "./features/templates/ProjectTemplatesPage";
import { TemplateEditorPage } from "./features/templates/TemplateEditorPage";
import { ProjectVocabulariesPage } from "./features/vocabularies/ProjectVocabulariesPage";

/**
 * Hash-based router: avoids issues with deep links under the Tauri
 * custom protocol on production builds. Each top-level route owns its
 * own layout (sidebar + main), keeping data providers scoped to where
 * they're actually needed.
 */
export const router = createHashRouter([
  {
    element: <RootShell />,
    children: [
      {
        path: "/",
        element: <HomeLayout />,
        children: [{ index: true, element: <ProjectPickerPage /> }],
      },
      {
        path: "/settings",
        element: <SettingsLayout />,
        children: [
          { index: true, element: <Navigate to="theme" replace /> },
          { path: "theme", element: <ThemeSection /> },
          { path: "appearance", element: <AppearanceSection /> },
        ],
      },
      {
        path: "/project",
        element: <ProjectLayout />,
        children: [
          { index: true, element: <ProjectEmptyState /> },
          { path: "entry/:id", element: <EntryEditorPage /> },
          { path: "templates", element: <ProjectTemplatesPage /> },
          { path: "templates/:id", element: <TemplateEditorPage /> },
          { path: "vocabularies", element: <ProjectVocabulariesPage /> },
          { path: "export", element: <ExportPage /> },
        ],
      },
    ],
  },
]);
