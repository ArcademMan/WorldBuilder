import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

import { TemplateIcon } from "../../../components/TemplateIcon";
import { computeBrokenEntryIds } from "../../../lib/wikilinks";
import type { Entry, Template } from "../../../types";

import { EntryListItem } from "./EntryListItem";
import styles from "./EntriesTree.module.css";

type Props = {
  entries: Entry[];
  templates: Template[];
};

type Group = {
  template: Template;
  entries: Entry[];
};

export function EntriesTree({ entries, templates }: Props) {
  const groups = useMemo<Group[]>(() => {
    const byTemplate = new Map<string, Entry[]>();
    for (const e of entries) {
      const list = byTemplate.get(e.templateId) ?? [];
      list.push(e);
      byTemplate.set(e.templateId, list);
    }
    return templates
      .map((t) => ({ template: t, entries: byTemplate.get(t.id) ?? [] }))
      .filter((g) => g.entries.length > 0);
  }, [entries, templates]);

  // Single scan of every entry's body+fields against the full entry set
  // to find broken `[[wikilinks]]`. Recomputed only when the entries or
  // templates collections change identity, so re-renders from unrelated
  // state are free.
  const brokenIds = useMemo(() => {
    const templatesById = new Map(templates.map((t) => [t.id, t] as const));
    return computeBrokenEntryIds(entries, templatesById);
  }, [entries, templates]);

  if (groups.length === 0) {
    return <p className={styles.empty}>No entries yet.</p>;
  }

  return (
    <ul className={styles.tree}>
      {groups.map((g) => (
        <TemplateGroup key={g.template.id} group={g} brokenIds={brokenIds} />
      ))}
    </ul>
  );
}

function TemplateGroup({ group, brokenIds }: { group: Group; brokenIds: Set<string> }) {
  const [open, setOpen] = useState(true);

  return (
    <li className={styles.group}>
      <button
        type="button"
        className={styles.groupHeader}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <ChevronRight
          size={14}
          strokeWidth={2}
          className={open ? styles.chevronOpen : styles.chevron}
        />
        {group.template.icon && (
          <span className={styles.icon}>
            <TemplateIcon icon={group.template.icon} size={15} />
          </span>
        )}
        <span className={styles.groupName}>{group.template.name}</span>
        <span className={styles.count}>{group.entries.length}</span>
      </button>
      {open && (
        <ul className={styles.children}>
          {group.entries.map((e) => (
            <EntryListItem key={e.id} entry={e} hasBroken={brokenIds.has(e.id)} />
          ))}
        </ul>
      )}
    </li>
  );
}
