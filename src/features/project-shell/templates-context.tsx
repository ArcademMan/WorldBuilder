import { createContext, useContext, type ReactNode } from "react";

import { useTemplates } from "../../hooks/use-templates";

type Value = ReturnType<typeof useTemplates>;

const TemplatesContext = createContext<Value | null>(null);

type ProviderProps = {
  projectPath: string;
  children: ReactNode;
};

export function TemplatesProvider({ projectPath, children }: ProviderProps) {
  const value = useTemplates(projectPath);
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
