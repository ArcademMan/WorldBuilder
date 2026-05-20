import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as api from "../lib/api";
import type { Project } from "../types";

export type OpenedProject = {
  /** Absolute path to the project folder on disk. */
  path: string;
  /** Parsed `worldbuilder.json` content. */
  meta: Project;
};

type ContextValue = {
  project: OpenedProject | null;
  /** True while restoring the active project from persisted state on mount. */
  loading: boolean;
  setProject: (project: OpenedProject | null) => void;
};

const CurrentProjectContext = createContext<ContextValue | null>(null);

export function CurrentProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProjectState] = useState<OpenedProject | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the previously active project (survives refresh and restart).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const path = await api.getActiveProjectPath();
        if (cancelled || !path) return;
        const meta = await api.openProject(path);
        if (cancelled) return;
        setProjectState({ path, meta });
      } catch {
        // Stale path — clear so we don't loop on a broken project next boot.
        try {
          await api.clearActiveProjectPath();
        } catch {
          /* ignore */
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setProject = useCallback((next: OpenedProject | null) => {
    setProjectState(next);
    if (next) {
      void api.setActiveProjectPath(next.path).catch(() => {});
    } else {
      void api.clearActiveProjectPath().catch(() => {});
    }
  }, []);

  const value = useMemo(
    () => ({ project, loading, setProject }),
    [project, loading, setProject],
  );
  return (
    <CurrentProjectContext.Provider value={value}>
      {children}
    </CurrentProjectContext.Provider>
  );
}

export function useCurrentProject(): ContextValue {
  const ctx = useContext(CurrentProjectContext);
  if (!ctx) {
    throw new Error(
      "useCurrentProject must be used inside <CurrentProjectProvider>",
    );
  }
  return ctx;
}
