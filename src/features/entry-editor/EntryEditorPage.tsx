import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "../../components/Button";
import { TemplateIcon } from "../../components/TemplateIcon";
import { FieldRenderer } from "../../components/fields";
import { isCommonFieldKey } from "../../constants/common-fields";
import { useCurrentProject } from "../../hooks/use-current-project";
import { useEntryViewMode } from "../../hooks/use-entry-view-mode";
import { useDraftsContext } from "../project-shell/drafts-context";
import { useEntriesContext } from "../project-shell/entries-context";
import { useTemplatesContext } from "../project-shell/templates-context";
import type { Entry, FieldDef, FieldValue } from "../../types";

import { BacklinksPanel } from "./BacklinksPanel";
import { EntryReadView } from "./EntryReadView";
import { ViewModeToggle } from "./ViewModeToggle";
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
  const { mode } = useEntryViewMode();
  const { get: getDraft, set: setDraftPersist, clear: clearDraft } =
    useDraftsContext();

  const [draft, setDraft] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backlinksKey, setBacklinksKey] = useState(0);

  // Load the draft when the routed id changes. Prefer an in-flight
  // draft from the DraftsProvider (survives tab switches) over the
  // server-backed entry. Once a draft is loaded for this id, do not
  // overwrite it on subsequent list refreshes — that would clobber
  // the user's in-progress edits.
  useEffect(() => {
    if (!id) return;
    if (draft?.id === id) return;
    const pending = getDraft(id);
    if (pending) {
      setDraft(pending);
      return;
    }
    const entry = items.find((e) => e.id === id);
    if (entry) setDraft(entry);
  }, [id, items, draft?.id, getDraft]);

  // Mirror every draft mutation into the shared DraftsProvider so the
  // working copy survives navigation away from this page.
  useEffect(() => {
    if (!id || !draft || draft.id !== id) return;
    setDraftPersist(id, draft);
  }, [id, draft, setDraftPersist]);

  // Ctrl/Cmd+S → force-save the current draft. Inline edits already
  // commit on blur, but this gives users an explicit save reflex.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // Blur the active field so its onChange has flushed into draft,
        // then trigger the save.
        const active = document.activeElement;
        if (active instanceof HTMLElement) active.blur();
        void commit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // commit closes over `draft` via the latest render, so we re-bind
    // whenever the draft identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

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
      clearDraft(saved.id);
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
      clearDraft(draft.id);
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
      // Common (built-in) keys map onto top-level Entry properties,
      // not the `fields` map.
      if (isCommonFieldKey(key)) {
        switch (key) {
          case "name":
          case "summary":
          case "body":
            return { ...d, [key]: typeof value === "string" ? value : "" };
          case "tags":
          case "images":
            return { ...d, [key]: Array.isArray(value) ? value : [] };
        }
      }
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

  async function commit() {
    if (!draft) return;
    if (!draft.name.trim()) return; // skip when name is empty (would fail validation)
    try {
      const saved = await save(draft);
      clearDraft(saved.id);
      setDraft(saved);
      setBacklinksKey((k) => k + 1);
    } catch (err) {
      setError(String(err));
    }
  }

  if (mode === "view") {
    return (
      <>
        <EntryReadView
          entry={draft}
          template={template}
          refreshKey={backlinksKey}
          onChangeField={setFieldValue}
          onChangeName={(v) => patch({ name: v })}
          onChangeBody={(v) => patch({ body: v })}
          onCommit={() => void commit()}
        />
        <ViewModeToggle />
      </>
    );
  }

  return (
    <>
    <form className={styles.editor} onSubmit={handleSave}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {template ? (
            <span className={styles.badge}>
              {template.icon && <TemplateIcon icon={template.icon} size={14} />}
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
          {template.fields.map((f) => (
            <FieldRenderer
              key={f.key}
              def={f}
              value={draft.fields[f.key]}
              onChange={(v) => setFieldValue(f.key, v)}
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
    <ViewModeToggle />
    </>
  );
}
