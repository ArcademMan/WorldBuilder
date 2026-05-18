import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import * as api from "../../lib/api";
import { useVocabularies, type LoadedVocab } from "../../hooks/use-vocabularies";
import type { Vocabulary, VocabularyItem } from "../../types";

import { useEntriesContext } from "./entries-context";

type Value = {
  vocabs: Vocabulary[];
  vocabsById: Map<string, LoadedVocab>;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;

  createVocabulary: (name: string) => Promise<Vocabulary>;
  createItem: (vocabularyId: string, label: string) => Promise<VocabularyItem>;
  renameItem: (itemId: string, label: string) => Promise<VocabularyItem>;
  deleteItem: (itemId: string) => Promise<void>;
  deleteVocabulary: (vocabularyId: string) => Promise<void>;
};

const VocabulariesContext = createContext<Value | null>(null);

type ProviderProps = {
  projectPath: string;
  children: ReactNode;
};

/**
 * Vocabularies provider. Wraps every mutation that can affect entries
 * (delete item, delete vocabulary) with a follow-up entries reload, so
 * the sidebar/editor reflect the purge automatically.
 */
export function VocabulariesProvider({ projectPath, children }: ProviderProps) {
  const inner = useVocabularies(projectPath);
  const entries = useEntriesContext();

  const createVocabulary = useCallback(
    async (name: string) => {
      const vocab = await api.createVocabulary(projectPath, name);
      await inner.reload();
      return vocab;
    },
    [projectPath, inner],
  );

  const createItem = useCallback(
    async (vocabularyId: string, label: string) => {
      const item = await api.createVocabularyItem(projectPath, vocabularyId, label);
      await inner.reload();
      return item;
    },
    [projectPath, inner],
  );

  const renameItem = useCallback(
    async (itemId: string, label: string) => {
      const item = await api.renameVocabularyItem(projectPath, itemId, label);
      await inner.reload();
      return item;
    },
    [projectPath, inner],
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      await api.deleteVocabularyItem(projectPath, itemId);
      await Promise.all([inner.reload(), entries.reload()]);
    },
    [projectPath, inner, entries],
  );

  const deleteVocabulary = useCallback(
    async (vocabularyId: string) => {
      await api.deleteVocabulary(projectPath, vocabularyId);
      await Promise.all([inner.reload(), entries.reload()]);
    },
    [projectPath, inner, entries],
  );

  const value = useMemo<Value>(
    () => ({
      vocabs: inner.vocabs,
      vocabsById: inner.vocabsById,
      loading: inner.loading,
      error: inner.error,
      reload: inner.reload,
      createVocabulary,
      createItem,
      renameItem,
      deleteItem,
      deleteVocabulary,
    }),
    [inner, createVocabulary, createItem, renameItem, deleteItem, deleteVocabulary],
  );

  return (
    <VocabulariesContext.Provider value={value}>
      {children}
    </VocabulariesContext.Provider>
  );
}

export function useVocabulariesContext(): Value {
  const ctx = useContext(VocabulariesContext);
  if (!ctx) {
    throw new Error(
      "useVocabulariesContext must be used inside <VocabulariesProvider>",
    );
  }
  return ctx;
}
