import { Link } from "react-router-dom";

import { useEntriesContext } from "../../features/project-shell/entries-context";
import { useTemplatesContext } from "../../features/project-shell/templates-context";
import type { FieldDef } from "../../types";

import { FormField } from "./FormField";
import { RefAutocomplete } from "./RefAutocomplete";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  disabled?: boolean;
};

/**
 * Multi-entry reference picker with chips + autocomplete + inline create.
 * Mirrors VocabListField's UX but resolves chips against project entries.
 */
export function RefListField({ def, value, onChange, disabled }: Props) {
  const { items: entries } = useEntriesContext();
  const { byId: templatesById } = useTemplatesContext();
  const targetTemplateIds = def.refTemplateIds ?? [];

  if (targetTemplateIds.length === 0) {
    return (
      <FormField label={def.label}>
        <p className={styles.warning}>No target templates configured.</p>
      </FormField>
    );
  }

  const selectedIds = value ?? [];
  const selectedSet = new Set(selectedIds);

  function pick(entryId: string) {
    if (selectedSet.has(entryId)) return;
    onChange([...selectedIds, entryId]);
  }

  function removeId(entryId: string) {
    const next = selectedIds.filter((id) => id !== entryId);
    onChange(next.length === 0 ? null : next);
  }

  return (
    <FormField
      label={def.label}
      helpText={
        def.helpText ?? "Pick existing entries or type to create a new one."
      }
      required={def.required}
    >
      <div className={styles.chipInput}>
        {selectedIds.map((id) => {
          const entry = entries.find((e) => e.id === id);
          if (!entry) {
            return (
              <span
                key={id}
                className={`${styles.chip} ${styles.chipBroken}`}
              >
                <em>(deleted)</em>
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={() => removeId(id)}
                  disabled={disabled}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </span>
            );
          }
          const tpl = templatesById.get(entry.templateId);
          return (
            <span key={id} className={styles.chip} title={tpl?.name}>
              <Link
                to={`/project/entry/${entry.id}`}
                className={styles.chipLink}
              >
                {entry.name}
              </Link>
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => removeId(id)}
                disabled={disabled}
                aria-label="Remove"
              >
                ✕
              </button>
            </span>
          );
        })}

        <RefAutocomplete
          targetTemplateIds={targetTemplateIds}
          excludeIds={selectedSet}
          onPick={(e) => pick(e.id)}
          disabled={disabled}
        />
      </div>
    </FormField>
  );
}
