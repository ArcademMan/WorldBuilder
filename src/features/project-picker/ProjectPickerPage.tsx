import { useNavigate } from "react-router-dom";

import * as api from "../../lib/api";
import { useCurrentProject } from "../../hooks/use-current-project";

import { NewProjectCard } from "./components/NewProjectCard";
import { OpenProjectCard } from "./components/OpenProjectCard";
import { RecentsList } from "./components/RecentsList";
import styles from "./ProjectPickerPage.module.css";

export function ProjectPickerPage() {
  const navigate = useNavigate();
  const { setProject } = useCurrentProject();

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
      <header className={styles.header}>
        <h1>WorldBuilder</h1>
        <p className={styles.subtitle}>Build your world. One entry at a time.</p>
      </header>

      <section className={styles.actions}>
        <NewProjectCard onCreate={handleCreate} />
        <OpenProjectCard onOpen={handleOpen} />
      </section>

      <section>
        <h2 className={styles.recentsHeading}>Recent</h2>
        <RecentsList onOpen={handleOpen} />
      </section>
    </main>
  );
}
