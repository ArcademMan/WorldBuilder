import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type TabKind = "entry" | "template";

export type Tab = {
  /** Stable key, e.g. `entry:abc-123`. */
  id: string;
  kind: TabKind;
  /** Display label. */
  label: string;
  /** Optional icon string (lucide:Name or emoji). */
  icon?: string;
  /** Route path the tab points to. */
  path: string;
};

type TabsContextValue = {
  tabs: Tab[];
  /** Opens (or upserts) a tab. Does not navigate. */
  open: (tab: Tab) => void;
  /** Closes a tab. Navigates to the neighbor if the closed tab was active. */
  close: (id: string) => void;
  /** Updates an existing tab in-place (label/icon refresh). No-op if missing. */
  update: (id: string, patch: Partial<Omit<Tab, "id">>) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

const STORAGE_PREFIX = "worldbuilder.tabs.";

function storageKey(scope: string) {
  return `${STORAGE_PREFIX}${scope}`;
}

function loadTabs(scope: string): Tab[] {
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is Tab =>
        !!t &&
        typeof t === "object" &&
        typeof (t as Tab).id === "string" &&
        typeof (t as Tab).path === "string" &&
        typeof (t as Tab).label === "string",
    );
  } catch {
    return [];
  }
}

function persistTabs(scope: string, tabs: Tab[]): void {
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(tabs));
  } catch {
    // best-effort
  }
}

type ProviderProps = {
  /** Used as the localStorage scope — typically the open project path. */
  scope: string;
  children: ReactNode;
};

export function TabsProvider({ scope, children }: ProviderProps) {
  const [tabs, setTabs] = useState<Tab[]>(() => loadTabs(scope));
  const navigate = useNavigate();
  const location = useLocation();

  // Reset when the scope changes (e.g. switching project).
  useEffect(() => {
    setTabs(loadTabs(scope));
  }, [scope]);

  useEffect(() => {
    persistTabs(scope, tabs);
  }, [scope, tabs]);

  const open = useCallback((tab: Tab) => {
    setTabs((prev) => {
      const existing = prev.findIndex((t) => t.id === tab.id);
      if (existing === -1) return [...prev, tab];
      // Update label/icon/path in case they changed.
      const copy = prev.slice();
      copy[existing] = { ...copy[existing], ...tab };
      return copy;
    });
  }, []);

  const close = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx === -1) return prev;
        const next = prev.filter((t) => t.id !== id);
        const closingActive = location.pathname === prev[idx].path;
        if (closingActive) {
          const neighbor = next[idx] ?? next[idx - 1];
          navigate(neighbor ? neighbor.path : "/project");
        }
        return next;
      });
    },
    [location.pathname, navigate],
  );

  const update = useCallback((id: string, patch: Partial<Omit<Tab, "id">>) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }, []);

  const value = useMemo(() => ({ tabs, open, close, update }), [tabs, open, close, update]);

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

export function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabs must be used within a TabsProvider");
  return ctx;
}
