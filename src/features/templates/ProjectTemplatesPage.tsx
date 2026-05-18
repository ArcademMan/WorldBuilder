import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";
import { useTemplatesContext } from "../project-shell/templates-context";

import styles from "./ProjectTemplatesPage.module.css";

/**
 * Flat list of every template in the project. Click a row to edit it,
 * or "+ New template" to create a blank one and jump straight to the
 * editor (which lives at /project/templates/:id).
 */
export function ProjectTemplatesPage() {
  const { items: templates, loading, error } = useTemplatesContext();
  const navigate = useNavigate();

  function handleNew() {
    navigate("/project/templates/new");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to="/project" className={styles.backLink}>
          ← Back to project
        </Link>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Templates</h1>
          <Button variant="primary" onClick={handleNew}>
            + New template
          </Button>
        </div>
      </header>

      {loading && <p className={styles.empty}>Loading…</p>}
      {error && <p className={styles.empty}>{error}</p>}

      {!loading && templates.length === 0 ? (
        <p className={styles.empty}>No templates yet.</p>
      ) : (
        <ul className={styles.list}>
          {templates.map((t) => (
            <li key={t.id} className={styles.row}>
              <div className={styles.rowMain}>
                {t.icon && <span className={styles.icon}>{t.icon}</span>}
                <Link to={`/project/templates/${t.id}`} className={styles.name}>
                  {t.name}
                </Link>
              </div>
              <span className={styles.fieldCount}>
                {t.fields.length} field{t.fields.length === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
