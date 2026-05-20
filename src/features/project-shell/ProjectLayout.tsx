import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useCurrentProject } from "../../hooks/use-current-project";
import { TabsProvider } from "../../hooks/use-tabs";
import { AppShell } from "../app-layout/AppShell";
import { TabBar } from "../app-layout/TabBar";

import { AddEntryFab } from "./components/AddEntryFab";
import { ProjectEmptyState } from "./components/ProjectEmptyState";
import { DraftsProvider } from "./drafts-context";
import { EntriesProvider, useEntriesContext } from "./entries-context";
import { ProjectSidebar } from "./ProjectSidebar";
import { TabSync } from "./TabSync";
import { TemplatesProvider, useTemplatesContext } from "./templates-context";
import { VocabulariesProvider } from "./vocabularies-context";

const NEW_ENTRY_DEFAULT_NAME = "Untitled";

/**
 * Layout for /project/*. Loads project-scoped data providers
 * (entries, templates, vocabularies) so both the sidebar and the
 * routed page see the same context. Without an open project,
 * falls back to an empty state.
 */
export function ProjectLayout() {
  const { project, loading } = useCurrentProject();

  if (loading) {
    return <ProjectEmptyState message="Restoring project…" />;
  }

  if (!project) {
    return <ProjectEmptyState message="No project is open." showBackLink />;
  }

  return (
    <EntriesProvider projectPath={project.path}>
      <TemplatesProvider projectPath={project.path}>
        <VocabulariesProvider projectPath={project.path}>
          <DraftsProvider>
          <TabsProvider scope={project.path}>
            <TabSync />
            <AppShell
              sidebar={<ProjectSidebar projectName={project.meta.name} />}
              topbar={<TabBar />}
            >
              <Outlet />
            </AppShell>
            <FloatingAddEntry />
          </TabsProvider>
          </DraftsProvider>
        </VocabulariesProvider>
      </TemplatesProvider>
    </EntriesProvider>
  );
}

function FloatingAddEntry() {
  const { items: templates } = useTemplatesContext();
  const { create } = useEntriesContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // The FAB creates entries, so it only makes sense on entry-centric pages.
  // Hide it on template/vocabulary/export views where it's just visual noise.
  if (/^\/project\/(templates|vocabularies|export)(\/|$)/.test(pathname)) {
    return null;
  }

  async function handleCreate(templateId: string) {
    try {
      const entry = await create(templateId, NEW_ENTRY_DEFAULT_NAME);
      navigate(`/project/entry/${entry.id}`);
    } catch (e) {
      alert(`Failed to create entry: ${e}`);
    }
  }

  return <AddEntryFab templates={templates} onCreate={(id) => void handleCreate(id)} />;
}
