import { useCallback, useEffect, useState } from "react";

import * as api from "../lib/api";
import type { Entry } from "../types";

type State = {
  items: Entry[];
  loading: boolean;
  error: string | null;
};

/**
 * Loads every entry in the given project and exposes mutators that
 * keep local state in sync after backend writes.
 *
 * Pass `null` when no project is open: the hook returns an empty list
 * and the mutators throw.
 */
export function useEntries(projectPath: string | null) {
  const [state, setState] = useState<State>({
    items: [],
    loading: false,
    error: null,
  });

  const reload = useCallback(async () => {
    if (!projectPath) {
      setState({ items: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const items = await api.listEntries(projectPath);
      setState({ items, loading: false, error: null });
    } catch (e) {
      setState({ items: [], loading: false, error: String(e) });
    }
  }, [projectPath]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (templateId: string, name: string): Promise<Entry> => {
      if (!projectPath) throw new Error("No project is open");
      const entry = await api.createEntry(projectPath, templateId, name);
      setState((s) => ({ ...s, items: [...s.items, entry] }));
      return entry;
    },
    [projectPath],
  );

  const save = useCallback(
    async (entry: Entry): Promise<Entry> => {
      if (!projectPath) throw new Error("No project is open");
      const saved = await api.saveEntry(projectPath, entry);
      setState((s) => ({
        ...s,
        items: s.items.map((e) => (e.id === saved.id ? saved : e)),
      }));
      return saved;
    },
    [projectPath],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      if (!projectPath) throw new Error("No project is open");
      await api.deleteEntry(projectPath, id);
      setState((s) => ({ ...s, items: s.items.filter((e) => e.id !== id) }));
    },
    [projectPath],
  );

  return { ...state, reload, create, save, remove };
}
