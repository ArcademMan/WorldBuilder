import { useCallback, useEffect, useState } from "react";

export type EntryViewMode = "view" | "edit";

const STORAGE_KEY = "worldbuilder.entryViewMode";
const DEFAULT_MODE: EntryViewMode = "view";

function readStored(): EntryViewMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "view" || raw === "edit") return raw;
  } catch {
    // ignore
  }
  return DEFAULT_MODE;
}

/**
 * Module-level subscribers, so every mounted hook re-renders when the
 * mode flips — even if the toggle and the consumer live in different
 * subtrees. (Lightweight alternative to a Context for a single boolean.)
 */
const listeners = new Set<(m: EntryViewMode) => void>();
let current: EntryViewMode = readStored();

function setGlobal(next: EntryViewMode) {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
  for (const fn of listeners) fn(next);
}

export function useEntryViewMode(): {
  mode: EntryViewMode;
  setMode: (m: EntryViewMode) => void;
  toggle: () => void;
} {
  const [mode, setMode] = useState<EntryViewMode>(current);

  useEffect(() => {
    const fn = (next: EntryViewMode) => setMode(next);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const apply = useCallback((next: EntryViewMode) => {
    setGlobal(next);
  }, []);

  const toggle = useCallback(() => {
    setGlobal(current === "view" ? "edit" : "view");
  }, []);

  return { mode, setMode: apply, toggle };
}
