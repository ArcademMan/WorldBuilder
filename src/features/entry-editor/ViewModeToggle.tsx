import { BookOpen, Pencil } from "lucide-react";

import { useEntryViewMode } from "../../hooks/use-entry-view-mode";

import styles from "./ViewModeToggle.module.css";

/**
 * Floating top-right pill that flips between the read-only viewer and
 * the form-driven editor. The choice is persisted globally.
 */
export function ViewModeToggle() {
  const { mode, toggle } = useEntryViewMode();
  const isView = mode === "view";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      title={isView ? "Switch to editor" : "Switch to viewer"}
      aria-label={isView ? "Switch to editor" : "Switch to viewer"}
    >
      {isView ? (
        <Pencil size={16} strokeWidth={1.75} />
      ) : (
        <BookOpen size={16} strokeWidth={1.75} />
      )}
    </button>
  );
}
