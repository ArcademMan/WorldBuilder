import { useCallback, useEffect, useMemo, useState } from "react";

import * as api from "../lib/api";
import type { Vocabulary, VocabularyItem } from "../types";

export type LoadedVocab = {
  vocab: Vocabulary;
  items: VocabularyItem[];
  itemsById: Map<string, VocabularyItem>;
};

type State = {
  vocabs: Vocabulary[];
  itemsByVocab: Record<string, VocabularyItem[]>;
  loading: boolean;
  error: string | null;
};

const EMPTY_STATE: State = {
  vocabs: [],
  itemsByVocab: {},
  loading: false,
  error: null,
};

/**
 * Loads every vocabulary and all their items into a single object so
 * field components can render labels and run autocomplete entirely
 * from memory. Pure data hook — side effects on other contexts (e.g.
 * refreshing entries after a purge) belong in the provider above.
 */
export function useVocabularies(projectPath: string | null) {
  const [state, setState] = useState<State>(EMPTY_STATE);

  const reload = useCallback(async () => {
    if (!projectPath) {
      setState(EMPTY_STATE);
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const vocabs = await api.listVocabularies(projectPath);
      const itemsByVocab: Record<string, VocabularyItem[]> = {};
      await Promise.all(
        vocabs.map(async (v) => {
          itemsByVocab[v.id] = await api.listVocabularyItems(projectPath, v.id);
        }),
      );
      setState({ vocabs, itemsByVocab, loading: false, error: null });
    } catch (e) {
      setState({
        vocabs: [],
        itemsByVocab: {},
        loading: false,
        error: String(e),
      });
    }
  }, [projectPath]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const vocabsById = useMemo<Map<string, LoadedVocab>>(() => {
    const m = new Map<string, LoadedVocab>();
    for (const v of state.vocabs) {
      const items = state.itemsByVocab[v.id] ?? [];
      const itemsById = new Map<string, VocabularyItem>();
      for (const it of items) itemsById.set(it.id, it);
      m.set(v.id, { vocab: v, items, itemsById });
    }
    return m;
  }, [state.vocabs, state.itemsByVocab]);

  return {
    vocabs: state.vocabs,
    vocabsById,
    loading: state.loading,
    error: state.error,
    reload,
  };
}
