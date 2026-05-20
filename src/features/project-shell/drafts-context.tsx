import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Entry } from "../../types";

/**
 * In-memory store of unsaved entry drafts, scoped to the open project.
 *
 * Lifecycle: a draft is created when EntryEditorPage first mounts for
 * an entry id. It survives navigation between tabs (entries) because
 * it lives above the routed page. It is cleared explicitly when the
 * user saves (replaced by the server-returned entry) or when the tab
 * is closed.
 *
 * Not persisted to disk: closing the app discards unsaved drafts.
 */
type DraftsContextValue = {
  /** Returns the draft for `id`, or undefined if none is in flight. */
  get: (id: string) => Entry | undefined;
  /** Replaces (or seeds) the draft for `id`. */
  set: (id: string, draft: Entry) => void;
  /** Removes the draft for `id` (e.g. after save or tab close). */
  clear: (id: string) => void;
  /** True if a draft exists and differs from the given baseline. */
  isDirty: (id: string, baseline: Entry | undefined) => boolean;
  /** Subscribe to dirty-state changes; returns the version counter. */
  version: number;
};

const DraftsContext = createContext<DraftsContextValue | null>(null);

export function DraftsProvider({ children }: { children: ReactNode }) {
  // The actual draft data lives in a ref so writes don't re-render the
  // whole tree on every keystroke. A separate version counter bumps
  // only when entries are added/removed/replaced wholesale, so the
  // TabBar's dirty indicator can react.
  const draftsRef = useRef<Map<string, Entry>>(new Map());
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const get = useCallback((id: string) => draftsRef.current.get(id), []);

  const set = useCallback(
    (id: string, draft: Entry) => {
      draftsRef.current.set(id, draft);
      // Bump on every write so consumers like TabBar can re-evaluate
      // the dirty indicator. The bump is cheap; subscribers do their
      // own equality checks before doing any real work.
      bump();
    },
    [bump],
  );

  const clear = useCallback(
    (id: string) => {
      if (draftsRef.current.delete(id)) bump();
    },
    [bump],
  );

  const isDirty = useCallback(
    (id: string, baseline: Entry | undefined) => {
      const draft = draftsRef.current.get(id);
      if (!draft) return false;
      if (!baseline) return true;
      return !entriesEqual(draft, baseline);
    },
    [],
  );

  const value = useMemo(
    () => ({ get, set, clear, isDirty, version }),
    [get, set, clear, isDirty, version],
  );

  return (
    <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>
  );
}

export function useDraftsContext(): DraftsContextValue {
  const ctx = useContext(DraftsContext);
  if (!ctx) {
    throw new Error("useDraftsContext must be used inside <DraftsProvider>");
  }
  return ctx;
}

function entriesEqual(a: Entry, b: Entry): boolean {
  if (a.name !== b.name) return false;
  if ((a.summary ?? "") !== (b.summary ?? "")) return false;
  if ((a.body ?? "") !== (b.body ?? "")) return false;
  if (!arrayEqual(a.tags ?? [], b.tags ?? [])) return false;
  if (!arrayEqual(a.images ?? [], b.images ?? [])) return false;
  // Field map: shallow JSON compare is good enough for primitive/array values.
  return JSON.stringify(a.fields ?? {}) === JSON.stringify(b.fields ?? {});
}

function arrayEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
