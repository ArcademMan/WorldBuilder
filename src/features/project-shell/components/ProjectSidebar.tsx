import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../../components/Button";

import { useEntriesContext } from "../entries-context";
import { useTemplatesContext } from "../templates-context";

import { EntryListItem } from "./EntryListItem";
import styles from "./ProjectSidebar.module.css";

type Props = {
  projectName: string;
};

const NEW_ENTRY_DEFAULT_NAME = "Untitled";

export function ProjectSidebar({ projectName }: Props) {
  const { items: entries, loading, error, create } = useEntriesContext();
  const { items: templates } = useTemplatesContext();
  const navigate = useNavigate();

  async function handleNew(templateId: string) {
    try {
      const entry = await create(templateId, NEW_ENTRY_DEFAULT_NAME);
      navigate(`/project/entry/${entry.id}`);
    } catch (e) {
      alert(`Failed to create entry: ${e}`);
    }
  }

  return (
    <aside className={styles.sidebar}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>
          ← Projects
        </Link>
        <h2 className={styles.projectName} title={projectName}>
          {projectName}
        </h2>
      </header>

      <section className={styles.newSection}>
        {templates.length === 0 ? (
          <p className={styles.muted}>No templates available.</p>
        ) : (
          templates.map((t) => (
            <Button
              key={t.id}
              variant="primary"
              onClick={() => void handleNew(t.id)}
            >
              + {t.icon ? `${t.icon} ` : ""}
              {t.name}
            </Button>
          ))
        )}
      </section>

      <section className={styles.entriesSection}>
        <h3 className={styles.entriesHeader}>Entries ({entries.length})</h3>
        {loading && <p className={styles.muted}>Loading…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && entries.length === 0 && (
          <p className={styles.muted}>No entries yet.</p>
        )}
        <ul className={styles.list}>
          {entries.map((e) => (
            <EntryListItem key={e.id} entry={e} />
          ))}
        </ul>
      </section>

      <footer className={styles.footer}>
        <Link to="/project/vocabularies" className={styles.footerLink}>
          🗂 Vocabularies
        </Link>
      </footer>
    </aside>
  );
}
