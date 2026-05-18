import { useCallback, useEffect, useState } from "react";

import * as api from "../lib/api";
import type { RecentProject } from "../types";

type State = {
  items: RecentProject[];
  loading: boolean;
  error: string | null;
};

/**
 * Loads the recent-projects list on mount and exposes mutators that
 * keep local state in sync with the backend.
 */
export function useRecents() {
  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const items = await api.listRecents();
      setState({ items, loading: false, error: null });
    } catch (e) {
      setState({ items: [], loading: false, error: String(e) });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const remove = useCallback(async (path: string) => {
    const items = await api.removeRecent(path);
    setState((s) => ({ ...s, items }));
  }, []);

  return { ...state, reload, remove };
}
