import { createContext, useContext, type ReactNode } from "react";

import { useEntries } from "../../hooks/use-entries";

type Value = ReturnType<typeof useEntries>;

const EntriesContext = createContext<Value | null>(null);

type ProviderProps = {
  projectPath: string;
  children: ReactNode;
};

/**
 * Single source of truth for the project's entries. Wrap the shell
 * so sidebar and editor read/mutate the same list and stay in sync
 * without prop drilling.
 */
export function EntriesProvider({ projectPath, children }: ProviderProps) {
  const value = useEntries(projectPath);
  return (
    <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
  );
}

export function useEntriesContext(): Value {
  const ctx = useContext(EntriesContext);
  if (!ctx) {
    throw new Error("useEntriesContext must be used inside <EntriesProvider>");
  }
  return ctx;
}
