import type { MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import { TemplateIcon } from "../../components/TemplateIcon";
import { useTabs } from "../../hooks/use-tabs";
import { useDraftsContext } from "../project-shell/drafts-context";
import { useEntriesContext } from "../project-shell/entries-context";

import styles from "./TabBar.module.css";

export function TabBar() {
  const { tabs, close } = useTabs();
  const navigate = useNavigate();
  const location = useLocation();
  const drafts = useDraftsContext();
  const { items: entries } = useEntriesContext();

  if (tabs.length === 0) return null;

  function handleClose(e: MouseEvent, id: string) {
    e.stopPropagation();
    if (id.startsWith("entry:")) {
      drafts.clear(id.slice("entry:".length));
    }
    close(id);
  }

  function handleMiddleClick(e: MouseEvent, id: string) {
    if (e.button !== 1) return;
    e.preventDefault();
    if (id.startsWith("entry:")) {
      drafts.clear(id.slice("entry:".length));
    }
    close(id);
  }

  function isDirty(tabId: string): boolean {
    if (!tabId.startsWith("entry:")) return false;
    const entryId = tabId.slice("entry:".length);
    const baseline = entries.find((e) => e.id === entryId);
    return drafts.isDirty(entryId, baseline);
  }

  return (
    <div className={styles.bar} role="tablist">
      {tabs.map((tab) => {
        const active = location.pathname === tab.path;
        const dirty = isDirty(tab.id);
        return (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tab} ${active ? styles.tabActive : ""}`}
            onClick={() => navigate(tab.path)}
            onMouseDown={(e) => handleMiddleClick(e, tab.id)}
            role="tab"
            aria-selected={active}
            title={dirty ? `${tab.label} • unsaved changes` : tab.label}
          >
            {tab.icon && (
              <span className={styles.tabIcon}>
                <TemplateIcon icon={tab.icon} size={14} />
              </span>
            )}
            <span className={styles.tabLabel}>{tab.label}</span>
            {dirty && (
              <span
                className={styles.dirtyDot}
                aria-label="unsaved changes"
              />
            )}
            <span
              className={styles.closeBtn}
              onClick={(e) => handleClose(e, tab.id)}
              role="button"
              aria-label={`Close ${tab.label}`}
              title="Close"
            >
              <X size={12} strokeWidth={2.25} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
