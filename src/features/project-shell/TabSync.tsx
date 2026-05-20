import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

import { useTabs } from "../../hooks/use-tabs";

import { useEntriesContext } from "./entries-context";
import { useTemplatesContext } from "./templates-context";

const ENTRY_PATH = /^\/project\/entry\/([^/]+)$/;
const TEMPLATE_PATH = /^\/project\/templates\/([^/]+)$/;

/**
 * Watches the current URL and opens/refreshes a tab whenever the user
 * navigates to a tabbable route (entry or template editor).
 *
 * Also keeps tab labels fresh when the underlying entry/template is
 * renamed in the editor.
 */
export function TabSync() {
  const { pathname } = useLocation();
  const { open, update, tabs } = useTabs();
  const { items: entries } = useEntriesContext();
  const { byId: templatesById } = useTemplatesContext();

  const entriesById = useMemo(
    () => new Map(entries.map((e) => [e.id, e])),
    [entries],
  );

  // Open / upsert tab on navigation.
  useEffect(() => {
    const entryMatch = pathname.match(ENTRY_PATH);
    if (entryMatch) {
      const id = entryMatch[1];
      const entry = entriesById.get(id);
      if (!entry) return;
      const template = templatesById.get(entry.templateId);
      open({
        id: `entry:${id}`,
        kind: "entry",
        label: entry.name || "(untitled)",
        icon: template?.icon,
        path: pathname,
      });
      return;
    }

    const templateMatch = pathname.match(TEMPLATE_PATH);
    if (templateMatch) {
      const id = templateMatch[1];
      if (id === "new") return; // skip the unsaved-template route
      const template = templatesById.get(id);
      if (!template) return;
      open({
        id: `template:${id}`,
        kind: "template",
        label: template.name || "(unnamed)",
        icon: template.icon,
        path: pathname,
      });
    }
  }, [pathname, entriesById, templatesById, open]);

  // Refresh open-tab labels/icons when the underlying data changes.
  useEffect(() => {
    for (const tab of tabs) {
      if (tab.kind === "entry") {
        const id = tab.id.slice("entry:".length);
        const entry = entriesById.get(id);
        if (!entry) continue;
        const template = templatesById.get(entry.templateId);
        const nextLabel = entry.name || "(untitled)";
        const nextIcon = template?.icon;
        if (tab.label !== nextLabel || tab.icon !== nextIcon) {
          update(tab.id, { label: nextLabel, icon: nextIcon });
        }
      } else if (tab.kind === "template") {
        const id = tab.id.slice("template:".length);
        const template = templatesById.get(id);
        if (!template) continue;
        const nextLabel = template.name || "(unnamed)";
        const nextIcon = template.icon;
        if (tab.label !== nextLabel || tab.icon !== nextIcon) {
          update(tab.id, { label: nextLabel, icon: nextIcon });
        }
      }
    }
  }, [tabs, entriesById, templatesById, update]);

  return null;
}
