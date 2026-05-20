import { useEffect, useRef, useState, type FocusEvent } from "react";

import { BareFieldProvider, FieldRenderer } from "../../components/fields";
import type { FieldDef, FieldValue } from "../../types";

import { ReadValue } from "./ReadValue";
import styles from "./EditableField.module.css";

type Props = {
  def: FieldDef;
  value: FieldValue | undefined;
  onChange: (value: FieldValue | null) => void;
  onCommit: () => void;
};

/**
 * Read-then-edit wrapper used by the viewer. Idle state shows ReadValue
 * with a subtle hover hint; click (or focus via keyboard) flips to the
 * real FieldRenderer, and blur outside the wrapper commits the change.
 */
export function EditableField({ def, value, onChange, onCommit }: Props) {
  const [editing, setEditing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Autofocus the first focusable input when entering edit mode.
  useEffect(() => {
    if (!editing) return;
    const el = wrapperRef.current?.querySelector<HTMLElement>(
      "input, textarea, select, button",
    );
    el?.focus();
  }, [editing]);

  function handleBlur(e: FocusEvent<HTMLDivElement>) {
    // Stay editing if focus is moving to another element inside the wrapper.
    const next = e.relatedTarget as Node | null;
    if (next && wrapperRef.current?.contains(next)) return;
    setEditing(false);
    onCommit();
  }

  if (!editing) {
    const maybeStart = (e: { target: EventTarget | null; currentTarget: EventTarget | null }) => {
      // Don't flip to edit mode if the user clicked an interactive
      // descendant (wikilinks, ref links, …) — let that action run.
      // `closest` on the wrapping <button> matches itself, so compare
      // against currentTarget to distinguish "clicked the wrapper" from
      // "clicked an interactive child".
      if (e.target instanceof Element) {
        const interactive = e.target.closest("a, button, input, select, textarea");
        if (interactive && interactive !== e.currentTarget) return;
      }
      setEditing(true);
    };
    return (
      <button
        type="button"
        className={styles.readTrigger}
        onClick={maybeStart}
        onFocus={maybeStart}
      >
        <ReadValue def={def} value={value} />
      </button>
    );
  }

  return (
    <div className={styles.editWrapper} ref={wrapperRef} onBlur={handleBlur}>
      <BareFieldProvider>
        <FieldRenderer def={def} value={value} onChange={onChange} />
      </BareFieldProvider>
    </div>
  );
}
