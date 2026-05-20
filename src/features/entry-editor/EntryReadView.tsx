import { useEffect, useMemo, useRef, useState } from "react";

import { TemplateIcon } from "../../components/TemplateIcon";
import { useCurrentProject } from "../../hooks/use-current-project";
import type { Entry, FieldValue, Template } from "../../types";

import { BacklinksPanel } from "./BacklinksPanel";
import { InlineBody } from "./InlineBody";
import { LayoutRenderer } from "./LayoutRenderer";
import styles from "./EntryReadView.module.css";

type Props = {
  entry: Entry;
  template: Template | undefined;
  refreshKey: number;
  onChangeField: (key: string, value: FieldValue | null) => void;
  onChangeName: (value: string) => void;
  onChangeBody: (value: string) => void;
  onCommit: () => void;
};

/**
 * "Wiki article" rendering of an entry — read-first but editable
 * inline: click on title, body or any field to edit; blur to save.
 * The same template layout is honored as in the editor.
 */
export function EntryReadView({
  entry,
  template,
  refreshKey,
  onChangeField,
  onChangeName,
  onChangeBody,
  onCommit,
}: Props) {
  const { project } = useCurrentProject();

  // Common-field keys that the template's custom layout already places
  // somewhere; those are rendered by LayoutRenderer and must NOT be
  // re-rendered as standalone sections below.
  const placedInLayout = useMemo(() => {
    const set = new Set<string>();
    for (const sec of template?.layout ?? []) {
      for (const it of sec.items) set.add(it.fieldKey);
    }
    return set;
  }, [template]);

  const showTags = entry.tags.length > 0 && !placedInLayout.has("tags");
  const hasLayoutOrFields = !!template && (template.fields.length > 0 || template.layout.length > 0);
  const showBody = !placedInLayout.has("body");

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        {template && (
          <div className={styles.badge}>
            {template.icon && <TemplateIcon icon={template.icon} size={14} />}
            <span>{template.name}</span>
          </div>
        )}
        <InlineTitle value={entry.name} onChange={onChangeName} onCommit={onCommit} />
        {showTags && (
          <ul className={styles.tagList}>
            {entry.tags.map((t) => (
              <li key={t} className={styles.tag}>
                {t}
              </li>
            ))}
          </ul>
        )}
      </header>

      {hasLayoutOrFields && (
        <section className={styles.fieldsSection}>
          <LayoutRenderer
            template={template}
            entry={entry}
            mode="view"
            onChange={onChangeField}
            onCommit={onCommit}
          />
        </section>
      )}

      {showBody && (
        <section className={styles.bodySection}>
          <InlineBody value={entry.body} onChange={onChangeBody} onCommit={onCommit} />
        </section>
      )}

      {project && (
        <BacklinksPanel
          projectPath={project.path}
          entryId={entry.id}
          refreshKey={refreshKey}
        />
      )}
    </article>
  );
}

function InlineTitle({
  value,
  onChange,
  onCommit,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function finish() {
    setEditing(false);
    onCommit();
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={styles.titleInput}
        value={value}
        placeholder="Untitled"
        onChange={(e) => onChange(e.target.value)}
        onBlur={finish}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            finish();
          } else if (e.key === "Escape") {
            finish();
          }
        }}
      />
    );
  }

  return (
    <h1
      className={styles.title}
      tabIndex={0}
      onClick={() => setEditing(true)}
      onFocus={() => setEditing(true)}
    >
      {value || <span className={styles.titlePlaceholder}>Untitled</span>}
    </h1>
  );
}

