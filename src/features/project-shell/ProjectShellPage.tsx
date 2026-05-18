import { Outlet } from "react-router-dom";

import { useCurrentProject } from "../../hooks/use-current-project";

import { EntriesProvider } from "./entries-context";
import { ProjectEmptyState } from "./components/ProjectEmptyState";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { TemplatesProvider } from "./templates-context";
import { VocabulariesProvider } from "./vocabularies-context";
import styles from "./ProjectShellPage.module.css";

/**
 * Two-pane layout shown after a project is opened. Entries and
 * templates are loaded once here and shared with every child route
 * via context, so the sidebar list and the editor stay in sync after
 * any mutation.
 */
export function ProjectShellPage() {
  const { project } = useCurrentProject();

  if (!project) {
    return <ProjectEmptyState message="No project is open." showBackLink />;
  }

  return (
    <EntriesProvider projectPath={project.path}>
      <TemplatesProvider projectPath={project.path}>
        <VocabulariesProvider projectPath={project.path}>
          <div className={styles.shell}>
            <ProjectSidebar projectName={project.meta.name} />
            <main className={styles.main}>
              <Outlet />
            </main>
          </div>
        </VocabulariesProvider>
      </TemplatesProvider>
    </EntriesProvider>
  );
}
