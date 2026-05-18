import { useState, type KeyboardEvent } from "react";

import type { FieldDef } from "../../types";

import { FormField } from "./FormField";
import styles from "./fields.module.css";

type Props = {
  def: FieldDef;
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  disabled?: boolean;
};

/**
 * Chip-style input: each committed value becomes a removable chip.
 * Commit triggers: Enter key, comma key, or input blur.
 * Backspace on an empty input pops the last chip.
 */
export function StringListField({ def, value, onChange, disabled }: Props) {
  const items = value ?? [];
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft("");
      return;
    }
    if (items.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...items, trimmed]);
    setDraft("");
  }

  function removeAt(index: number) {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length === 0 ? null : next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && items.length > 0) {
      onChange(items.slice(0, -1));
    }
  }

  return (
    <FormField
      label={def.label}
      helpText={def.helpText ?? "Press Enter or comma to add."}
      required={def.required}
    >
      <div className={styles.chipInput}>
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className={styles.chip}>
            {item}
            <button
              type="button"
              className={styles.chipRemove}
              onClick={() => removeAt(i)}
              disabled={disabled}
              aria-label={`Remove ${item}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          className={styles.chipNewInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          disabled={disabled}
        />
      </div>
    </FormField>
  );
}
