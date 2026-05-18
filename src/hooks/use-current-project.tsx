import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { Project } from "../types";

export type OpenedProject = {
  /** Absolute path to the project folder on disk. */
  path: string;
  /** Parsed `worldbuilder.json` content. */
  meta: Project;
};

type ContextValue = {
  project: OpenedProject | null;
  setProject: (project: OpenedProject | null) => void;
};

const CurrentProjectContext = createContext<ContextValue | null>(null);

export function CurrentProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<OpenedProject | null>(null);
  const value = useMemo(() => ({ project, setProject }), [project]);
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
