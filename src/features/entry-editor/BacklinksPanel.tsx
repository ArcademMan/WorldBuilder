import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { TemplateIcon } from "../../components/TemplateIcon";
import { COMMON_FIELD_DEFS } from "../../constants/common-fields";
import * as api from "../../lib/api";
import type { Backlink } from "../../types";
import { useTemplatesContext } from "../project-shell/templates-context";

import styles from "./BacklinksPanel.module.css";

type Props = {
  projectPath: string;
  entryId: string;
  /** Bumped by the parent after save, so the panel re-fetches. */
  refreshKey?: number;
};

/**
 * Lists every entry that references the current one. Renders the source
 * entry name (linked) plus the field label resolved against the source
 * template, so the user can see *why* the link exists.
 */
export function BacklinksPanel({ projectPath, entryId, refreshKey }: Props) {
  const { byId: templatesById } = useTemplatesContext();
  const [items, setItems] = useState<Backlink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listBacklinks(projectPath, entryId)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectPath, entryId, refreshKey]);

  return (
    <aside className={styles.panel}>
      <h3 className={styles.title}>Linked from</h3>
      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className={styles.muted}>No incoming references yet.</p>
      )}
      <ul className={styles.list}>
        {items.map((b) => {
          const tpl = templatesById.get(b.sourceTemplateId);
          const fieldLabel =
            tpl?.fields.find((f) => f.key === b.fieldKey)?.label ??
            COMMON_FIELD_DEFS.find((f) => f.key === b.fieldKey)?.label ??
            b.fieldKey;
          return (
            <li
              key={`${b.sourceEntryId}-${b.fieldKey}`}
              className={styles.item}
            >
              <Link
                to={`/project/entry/${b.sourceEntryId}`}
                className={styles.link}
              >
                {tpl?.icon && <TemplateIcon icon={tpl.icon} size={14} />}
                <span>{b.sourceName}</span>
              </Link>
              <span className={styles.meta}>
                {tpl ? `${tpl.name} · ` : ""}
                {fieldLabel}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
