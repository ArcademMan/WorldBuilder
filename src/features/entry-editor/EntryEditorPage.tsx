import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "../../components/Button";
import { FieldRenderer } from "../../components/fields";
import { useCurrentProject } from "../../hooks/use-current-project";
import { useEntriesContext } from "../project-shell/entries-context";
import { useTemplatesContext } from "../project-shell/templates-context";
import type { Entry, FieldDef, FieldValue } from "../../types";

import { BacklinksPanel } from "./BacklinksPanel";
import styles from "./EntryEditorPage.module.css";

const NAME_DEF: FieldDef = {
  key: "name",
  label: "Name",
  type: "string",
  required: true,
};
const BODY_DEF: FieldDef = {
  key: "body",
  label: "Body",
  type: "markdown",
};

export function EntryEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { project } = useCurrentProject();
  const { items, save, remove } = useEntriesContext();
  const { byId: templatesById, loading: templatesLoading } = useTemplatesContext();

  const [draft, setDraft] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backlinksKey, setBacklinksKey] = useState(0);

  // Load the draft from the list when the routed id changes, or when
  // the entry first appears in the list. Once a draft is loaded for
  // this id, don't overwrite it on subsequent list refreshes — that
  // would clobber the user's in-progress edits.
  useEffect(() => {
    if (!id) return;
    if (draft?.id === id) return;
    const entry = items.find((e) => e.id === id);
    if (entry) setDraft(entry);
  }, [id, items, draft?.id]);

  if (!id) {
    return <p className={styles.empty}>No entry selected.</p>;
  }
  if (!draft) {
    return <p className={styles.empty}>Loading entry…</p>;
  }

  const template = templatesById.get(draft.templateId);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = await save(draft);
      setDraft(saved);
      setBacklinksKey((k) => k + 1);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!draft) return;
    if (!confirm(`Delete "${draft.name || "untitled"}"? This cannot be undone.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await remove(draft.id);
      navigate("/project");
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  }

  function patch(partial: Partial<Entry>) {
    setDraft((d) => (d ? { ...d, ...partial } : d));
  }

  function setFieldValue(key: string, value: FieldValue | null) {
    setDraft((d) => {
      if (!d) return d;
      const fields = { ...d.fields };
      if (value === null || value === undefined) {
        delete fields[key];
      } else {
        fields[key] = value;
      }
      return { ...d, fields };
    });
  }

  const onName = (v: FieldValue | null) =>
    patch({ name: typeof v === "string" ? v : "" });
  const onBody = (v: FieldValue | null) =>
    patch({ body: typeof v === "string" ? v : "" });

  return (
    <form className={styles.editor} onSubmit={handleSave}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {template ? (
            <span className={styles.badge}>
              {template.icon ? `${template.icon} ` : ""}
              {template.name}
            </span>
          ) : templatesLoading ? (
            <span className={styles.badgeMuted}>Loading template…</span>
          ) : (
            <span className={styles.badgeError}>
              Unknown template: {draft.templateId}
            </span>
          )}
          <small className={styles.timestamp}>
            Updated {draft.updatedAt}
          </small>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={handleDelete} disabled={busy}>
            Delete
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={busy || !draft.name.trim()}
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.section}>
        <FieldRenderer def={NAME_DEF} value={draft.name} onChange={onName} disabled={busy} />
      </section>

      {template && template.fields.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Infobox</h3>
          {template.fields.map((def) => (
            <FieldRenderer
              key={def.key}
              def={def}
              value={draft.fields[def.key]}
              onChange={(v) => setFieldValue(def.key, v)}
              disabled={busy}
            />
          ))}
        </section>
      )}

      <section className={styles.section}>
        <FieldRenderer def={BODY_DEF} value={draft.body} onChange={onBody} disabled={busy} />
      </section>

      {project && (
        <BacklinksPanel
          projectPath={project.path}
          entryId={draft.id}
          refreshKey={backlinksKey}
        />
      )}
    </form>
  );
}
