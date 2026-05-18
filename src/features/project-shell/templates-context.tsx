import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useTemplates } from "../../hooks/use-templates";

import { useEntriesContext } from "./entries-context";

type Value = ReturnType<typeof useTemplates>;

const TemplatesContext = createContext<Value | null>(null);

type ProviderProps = {
  projectPath: string;
  children: ReactNode;
};

/**
 * Wraps `useTemplates` and, on delete, also reloads entries — a deleted
 * template leaves behind orphan entries whose row in the sidebar shouldn't
 * keep its stale name/icon.
 *
 * MUST be rendered inside <EntriesProvider>.
 */
export function TemplatesProvider({ projectPath, children }: ProviderProps) {
  const base = useTemplates(projectPath);
  const entries = useEntriesContext();

  const value = useMemo<Value>(
    () => ({
      ...base,
      remove: async (id: string) => {
        await base.remove(id);
        await entries.reload();
      },
    }),
    [base, entries],
  );

  return (
    <TemplatesContext.Provider value={value}>
      {children}
    </TemplatesContext.Provider>
  );
}

export function useTemplatesContext(): Value {
  const ctx = useContext(TemplatesContext);
  if (!ctx) {
    throw new Error(
      "useTemplatesContext must be used inside <TemplatesProvider>",
    );
  }
  return ctx;
}
