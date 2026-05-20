import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { TemplateIcon } from "../../../components/TemplateIcon";
import type { Template } from "../../../types";

import styles from "./AddEntryFab.module.css";

type Props = {
  templates: Template[];
  onCreate: (templateId: string) => void;
};

export function AddEntryFab({ templates, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(templateId: string) {
    setOpen(false);
    onCreate(templateId);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuLabel}>Create new…</div>
          {templates.length === 0 ? (
            <div className={styles.empty}>No templates available.</div>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className={styles.menuItem}
                onClick={() => pick(t.id)}
                role="menuitem"
              >
                {t.icon && (
                  <span className={styles.itemIcon}>
                    <TemplateIcon icon={t.icon} size={16} />
                  </span>
                )}
                <span>{t.name}</span>
              </button>
            ))
          )}
        </div>
      )}
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label="Create new entry"
        aria-expanded={open}
        title="Create new entry"
      >
        <Plus size={20} strokeWidth={2.25} />
      </button>
    </div>
  );
}
