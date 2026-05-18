import { useCallback, useEffect, useMemo, useState } from "react";

import * as api from "../lib/api";
import type { Template } from "../types";

type State = {
  items: Template[];
  loading: boolean;
  error: string | null;
};

/**
 * Loads every template in the given project. Returns a Map keyed by
 * `Template.id` for O(1) lookups from forms that need a template by id.
 */
export function useTemplates(projectPath: string | null) {
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
      const items = await api.listTemplates(projectPath);
      setState({ items, loading: false, error: null });
    } catch (e) {
      setState({ items: [], loading: false, error: String(e) });
    }
  }, [projectPath]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byId = useMemo(() => {
    const map = new Map<string, Template>();
    for (const t of state.items) map.set(t.id, t);
    return map;
  }, [state.items]);

  return { ...state, byId, reload };
}
