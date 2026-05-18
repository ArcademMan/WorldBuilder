import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "../../components/Button";
import { useTemplatesContext } from "../project-shell/templates-context";
import { useVocabulariesContext } from "../project-shell/vocabularies-context";
import type { FieldDef, Template } from "../../types";

import { FieldRow } from "./components/FieldRow";
import styles from "./TemplateEditorPage.module.css";

const KEY_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

/**
 * Keys claimed by the entry's first-class columns. Letting a user reuse
 * them would put two inputs on screen editing different values.
 */
const RESERVED_KEYS = new Set(["name", "summary", "tags", "body", "images"]);

function blankField(): FieldDef {
  return { key: "", label: "", type: "string" };
}

function blankTemplate(): Template {
  return {
    id: crypto.randomUUID(),
    name: "",
    icon: "",
    fields: [],
  };
}

type FieldErrors = Record<number, string>;

/**
 * Validates the field list. Returns per-index error messages keyed by
 * row index — empty object means the form is valid.
 */
function validateFields(fields: FieldDef[]): FieldErrors {
  const errors: FieldErrors = {};
  const seen = new Map<string, number>();
  fields.forEach((f, i) => {
    const key = f.key.trim();
    if (!key) {
      errors[i] = "Key is required.";
      return;
    }
    if (!KEY_REGEX.test(key)) {
      errors[i] =
        "Key must start with a letter and contain only letters, digits, and underscores.";
      return;
    }
    if (RESERVED_KEYS.has(key.toLowerCase())) {
      errors[i] = `"${key}" is reserved (used by the entry's built-in fields).`;
      return;
    }
    if (seen.has(key)) {
      errors[i] = `Duplicate key — already used at row ${(seen.get(key) ?? 0) + 1}.`;
      return;
    }
    seen.set(key, i);
    if (!f.label.trim()) {
      errors[i] = "Label is required.";
      return;
    }
    if ((f.type === "vocab" || f.type === "vocabList") && !f.vocabularyId) {
      errors[i] = "Pick a vocabulary for this field.";
      return;
    }
    if (
      (f.type === "ref" || f.type === "refList") &&
      (!f.refTemplateIds || f.refTemplateIds.length === 0)
    ) {
      errors[i] = "Pick at least one target template for this reference.";
      return;
    }
  });
  return errors;
}

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    items: templates,
    byId,
    save,
    remove,
    loading: templatesLoading,
  } = useTemplatesContext();
  const { vocabs } = useVocabulariesContext();

  const isNew = id === "new";
  const existing = !isNew && id ? byId.get(id) : undefined;

  const [draft, setDraft] = useState<Template | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Seed the draft once the source template is available.
  useEffect(() => {
    if (isNew) {
      setDraft((d) => d ?? blankTemplate());
      return;
    }
    if (existing) {
      setDraft(structuredClone(existing));
    }
  }, [isNew, existing]);

  const fieldErrors = useMemo(
    () => (draft ? validateFields(draft.fields) : {}),
    [draft],
  );
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const canSave =
    !!draft && !!draft.name.trim() && !hasFieldErrors && !saving;

  if (!draft) {
    if (templatesLoading) {
      return (
        <main className={styles.page}>
          <p className={styles.empty}>Loading…</p>
        </main>
      );
    }
    if (!isNew) {
      return (
        <main className={styles.page}>
          <p>
            <Link to="/project/templates" className={styles.backLink}>
              ← Back to templates
            </Link>
          </p>
          <p className={styles.empty}>Template not found.</p>
        </main>
      );
    }
    return null;
  }

  function patch(patch: Partial<Template>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }

  function patchField(index: number, next: FieldDef) {
    setDraft((d) => {
      if (!d) return d;
      const fields = d.fields.slice();
      fields[index] = next;
      return { ...d, fields };
    });
  }

  function moveField(index: number, delta: -1 | 1) {
    setDraft((d) => {
      if (!d) return d;
      const target = index + delta;
      if (target < 0 || target >= d.fields.length) return d;
      const fields = d.fields.slice();
      const [row] = fields.splice(index, 1);
      fields.splice(target, 0, row);
      return { ...d, fields };
    });
  }

  function removeField(index: number) {
    setDraft((d) => {
      if (!d) return d;
      return { ...d, fields: d.fields.filter((_, i) => i !== index) };
    });
  }

  function addField() {
    setDraft((d) =>
      d ? { ...d, fields: [...d.fields, blankField()] } : d,
    );
  }

  async function handleSave() {
    if (!draft) return;
    setGlobalError(null);
    if (!draft.name.trim()) {
      setNameError("Name is required.");
      return;
    }
    setNameError(null);
    if (hasFieldErrors) return;

    setSaving(true);
    try {
      const payload: Template = {
        ...draft,
        name: draft.name.trim(),
        icon: draft.icon?.trim() || undefined,
        fields: draft.fields.map((f) => ({
          ...f,
          key: f.key.trim(),
          label: f.label.trim(),
          helpText: f.helpText?.trim() || undefined,
        })),
      };
      const saved = await save(payload);
      if (isNew) {
        navigate(`/project/templates/${saved.id}`, { replace: true });
      } else {
        setDraft(structuredClone(saved));
      }
    } catch (e) {
      setGlobalError(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!draft || isNew) return;
    if (!confirm(`Delete template "${draft.name}"?`)) return;
    setGlobalError(null);
    setDeleting(true);
    try {
      await remove(draft.id);
      navigate("/project/templates", { replace: true });
    } catch (e) {
      setGlobalError(String(e));
      setDeleting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to="/project/templates" className={styles.backLink}>
          ← Back to templates
        </Link>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>
            {isNew ? "New template" : `Edit: ${existing?.name ?? draft.name}`}
          </h1>
          <div className={styles.headerActions}>
            {!isNew && (
              <Button
                variant="ghost"
                disabled={deleting}
                onClick={() => void handleDelete()}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            )}
            <Button
              variant="primary"
              disabled={!canSave}
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </header>

      {globalError && <p className={styles.globalError}>{globalError}</p>}

      <section className={styles.metaGrid}>
        <div className={styles.formField}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={draft.name}
            placeholder="e.g. Character"
            onChange={(e) => {
              patch({ name: e.target.value });
              if (nameError) setNameError(null);
            }}
          />
          {nameError && <p className={styles.fieldError}>{nameError}</p>}
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>Icon (emoji)</label>
          <input
            className={styles.input}
            value={draft.icon ?? ""}
            placeholder="e.g. 👤"
            onChange={(e) => patch({ icon: e.target.value })}
          />
        </div>
      </section>

      <section className={styles.fieldsSection}>
        <div className={styles.fieldsHeader}>
          <h2 className={styles.sectionTitle}>Fields</h2>
          <Button variant="secondary" onClick={addField}>
            + Add field
          </Button>
        </div>

        {draft.fields.length === 0 ? (
          <p className={styles.empty}>
            No fields yet. Click <em>Add field</em> to start.
          </p>
        ) : (
          draft.fields.map((f, i) => (
            <FieldRow
              key={f.id ?? `new-${i}`}
              field={f}
              index={i}
              total={draft.fields.length}
              vocabularies={vocabs}
              templates={templates}
              keyError={fieldErrors[i]}
              onChange={(next) => patchField(i, next)}
              onMoveUp={() => moveField(i, -1)}
              onMoveDown={() => moveField(i, 1)}
              onRemove={() => removeField(i)}
            />
          ))
        )}
      </section>
    </main>
  );
}
