import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import * as api from "../../lib/api";
import { useCurrentProject } from "../../hooks/use-current-project";

import { NewProjectCard } from "./components/NewProjectCard";
import { OpenProjectCard } from "./components/OpenProjectCard";
import { RecentsList } from "./components/RecentsList";
import styles from "./ProjectPickerPage.module.css";

export function ProjectPickerPage() {
  const navigate = useNavigate();
  const { project, loading, setProject } = useCurrentProject();

  // If a project was auto-restored, jump straight into it.
  useEffect(() => {
    if (!loading && project) navigate("/project", { replace: true });
  }, [loading, project, navigate]);

  async function enterProject(path: string, meta: Awaited<ReturnType<typeof api.openProject>>) {
    setProject({ path, meta });
    await api.addRecent({
      path,
      name: meta.name,
      lastOpenedAt: new Date().toISOString(),
    });
    navigate("/project");
  }

  async function handleOpen(path: string) {
    const meta = await api.openProject(path);
    await enterProject(path, meta);
  }

  async function handleCreate(path: string, name: string) {
    const meta = await api.createProject(path, name);
    await enterProject(path, meta);
  }

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Get started</h1>
        <p className={styles.pageSubtitle}>
          Create a new world or open an existing project to continue.
        </p>
      </header>

      <section className={styles.actions}>
        <NewProjectCard onCreate={handleCreate} />
        <OpenProjectCard onOpen={handleOpen} />
      </section>

      <section className={styles.recentsSection}>
        <h2 className={styles.recentsHeading}>Recent projects</h2>
        <RecentsList onOpen={handleOpen} />
      </section>
    </main>
  );
}
