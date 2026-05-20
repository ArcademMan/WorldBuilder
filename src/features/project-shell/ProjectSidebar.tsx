import { Link } from "react-router-dom";
import { LayoutGrid, FileStack, Settings } from "lucide-react";

import { SidebarShell } from "../app-layout/SidebarShell";

import { EntriesTree } from "./components/EntriesTree";
import { useEntriesContext } from "./entries-context";
import { useTemplatesContext } from "./templates-context";

import styles from "./ProjectSidebar.module.css";

type Props = { projectName: string };

export function ProjectSidebar({ projectName }: Props) {
  const { items: entries, loading, error } = useEntriesContext();
  const { items: templates } = useTemplatesContext();

  return (
    <SidebarShell
      header={
        <div className={styles.headerRow}>
          <h2 className={styles.projectName} title={projectName}>
            {projectName}
          </h2>
        </div>
      }
      footer={
        <>
          <Link to="/project/templates" className={styles.footerLink}>
            <LayoutGrid size={15} strokeWidth={1.75} />
            <span>Templates</span>
          </Link>
          <Link to="/project/vocabularies" className={styles.footerLink}>
            <FileStack size={15} strokeWidth={1.75} />
            <span>Vocabularies</span>
          </Link>
          <Link to="/settings" className={styles.footerLink}>
            <Settings size={15} strokeWidth={1.75} />
            <span>Settings</span>
          </Link>
        </>
      }
    >
      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && <EntriesTree entries={entries} templates={templates} />}
    </SidebarShell>
  );
}
