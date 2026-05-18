import { Button } from "../../../components/Button";
import type { FieldDef, FieldType, Template, Vocabulary } from "../../../types";

import styles from "../TemplateEditorPage.module.css";

const FIELD_TYPE_OPTIONS: Array<{ value: FieldType; label: string }> = [
  { value: "string", label: "String" },
  { value: "text", label: "Text (multi-line)" },
  { value: "markdown", label: "Markdown" },
  { value: "stringList", label: "String list" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "image", label: "Image" },
  { value: "imageList", label: "Image list" },
  { value: "ref", label: "Reference (link to entry)" },
  { value: "refList", label: "Reference list (multiple)" },
  { value: "vocab", label: "Vocabulary" },
  { value: "vocabList", label: "Vocabulary list" },
];

type Props = {
  field: FieldDef;
  index: number;
  total: number;
  vocabularies: Vocabulary[];
  templates: Template[];
  keyError?: string;
  onChange: (next: FieldDef) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

/**
 * One editable field row. Keeps the form schema in sync with FieldDef
 * shape: clears vocabularyId when the type stops being vocab/vocabList,
 * and surfaces the parent's uniqueness/regex error inline.
 */
export function FieldRow({
  field,
  index,
  total,
  vocabularies,
  templates,
  keyError,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: Props) {
  const needsVocab = field.type === "vocab" || field.type === "vocabList";
  const needsRef = field.type === "ref" || field.type === "refList";
  const selectedRefIds = new Set(field.refTemplateIds ?? []);

  function handleTypeChange(next: FieldType) {
    const update: FieldDef = { ...field, type: next };
    if (next !== "vocab" && next !== "vocabList") {
      delete update.vocabularyId;
    }
    if (next !== "ref" && next !== "refList") {
      delete update.refTemplateIds;
    }
    onChange(update);
  }

  function toggleRefTemplate(id: string) {
    const next = new Set(selectedRefIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange({
      ...field,
      refTemplateIds: next.size === 0 ? undefined : Array.from(next),
    });
  }

  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldRowGrid}>
        <div className={styles.formField}>
          <label className={styles.label}>Key</label>
          <input
            className={styles.input}
            value={field.key}
            placeholder="e.g. species"
            onChange={(e) => onChange({ ...field, key: e.target.value })}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.label}>Label</label>
          <input
            className={styles.input}
            value={field.label}
            placeholder="e.g. Species"
            onChange={(e) => onChange({ ...field, label: e.target.value })}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.label}>Type</label>
          <select
            className={styles.select}
            value={field.type}
            onChange={(e) => handleTypeChange(e.target.value as FieldType)}
          >
            {FIELD_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldActions}>
          <Button
            variant="ghost"
            disabled={index === 0}
            title="Move up"
            onClick={onMoveUp}
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            disabled={index === total - 1}
            title="Move down"
            onClick={onMoveDown}
          >
            ↓
          </Button>
          <Button variant="ghost" title="Remove field" onClick={onRemove}>
            ✕
          </Button>
        </div>
      </div>

      {keyError && <p className={styles.fieldError}>{keyError}</p>}

      {needsRef && (
        <div className={styles.formField}>
          <label className={styles.label}>
            Target template{field.type === "refList" ? "(s)" : ""}
          </label>
          {templates.length === 0 ? (
            <p className={styles.fieldError}>
              No other templates yet — create one first to use this field type.
            </p>
          ) : (
            <div className={styles.refTargets}>
              {templates.map((t) => (
                <label key={t.id} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={selectedRefIds.has(t.id)}
                    onChange={() => toggleRefTemplate(t.id)}
                  />
                  {t.icon ? `${t.icon} ` : ""}
                  {t.name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {needsVocab && (
        <div className={styles.formField}>
          <label className={styles.label}>Vocabulary</label>
          <select
            className={styles.select}
            value={field.vocabularyId ?? ""}
            onChange={(e) =>
              onChange({
                ...field,
                vocabularyId: e.target.value || undefined,
              })
            }
          >
            <option value="">— Pick a vocabulary —</option>
            {vocabularies.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.fieldRowExtras}>
        <div className={styles.formField}>
          <label className={styles.label}>Help text (optional)</label>
          <input
            className={styles.input}
            value={field.helpText ?? ""}
            onChange={(e) =>
              onChange({ ...field, helpText: e.target.value || undefined })
            }
          />
        </div>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={field.required ?? false}
            onChange={(e) =>
              onChange({
                ...field,
                required: e.target.checked ? true : undefined,
              })
            }
          />
          Required
        </label>
      </div>
    </div>
  );
}
