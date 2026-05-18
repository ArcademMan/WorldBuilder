import { Link } from "react-router-dom";

import { useEntriesContext } from "../../features/project-shell/entries-context";
import { useTemplatesContext } from "../../features/project-shell/templates-context";
import type { FieldDef } from "../../types";

import { FormField } from "./FormField";
import { RefAutocomplete } from "./RefAutocomplete";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
};

/**
 * Single-entry reference picker. When set, shows a chip with the linked
 * entry's name (clickable to navigate) plus a clear button; otherwise an
 * autocomplete that searches entries of the allowed templates and offers
 * inline create.
 */
export function RefField({ def, value, onChange, disabled }: Props) {
  const { items: entries } = useEntriesContext();
  const { byId: templatesById } = useTemplatesContext();
  const targetTemplateIds = def.refTemplateIds ?? [];

  if (targetTemplateIds.length === 0) {
    return (
      <FormField label={def.label}>
        <p className={styles.warning}>No target template configured.</p>
      </FormField>
    );
  }

  const selected = value ? entries.find((e) => e.id === value) : null;
  const isBroken = !!value && !selected;

  return (
    <FormField
      label={def.label}
      helpText={def.helpText}
      required={def.required}
    >
      <div className={styles.chipInput}>
        {selected && (
          <span className={styles.chip}>
            <Link
              to={`/project/entry/${selected.id}`}
              className={styles.chipLink}
            >
              {selected.name}
            </Link>
            <button
              type="button"
              className={styles.chipRemove}
              onClick={() => onChange(null)}
              disabled={disabled}
              aria-label="Clear"
            >
              ✕
            </button>
          </span>
        )}
        {isBroken && (
          <span className={`${styles.chip} ${styles.chipBroken}`}>
            <em>(deleted)</em>
            <button
              type="button"
              className={styles.chipRemove}
              onClick={() => onChange(null)}
              disabled={disabled}
              aria-label="Clear"
            >
              ✕
            </button>
          </span>
        )}
        {!selected && !isBroken && (
          <RefAutocomplete
            targetTemplateIds={targetTemplateIds}
            excludeIds={new Set()}
            onPick={(e) => onChange(e.id)}
            disabled={disabled}
            placeholder={placeholderFor(targetTemplateIds, templatesById)}
          />
        )}
      </div>
    </FormField>
  );
}

function placeholderFor(
  ids: string[],
  templatesById: Map<string, { name: string }>,
): string {
  const names = ids
    .map((id) => templatesById.get(id)?.name)
    .filter((n): n is string => !!n);
  if (names.length === 0) return "Type to search or create…";
  if (names.length === 1) return `Pick a ${names[0]} or create one…`;
  return `Pick or create (${names.join(", ")})…`;
}
