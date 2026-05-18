import { invoke } from "@tauri-apps/api/core";

import type { Vocabulary, VocabularyItem } from "../../types";

export function listVocabularies(projectPath: string): Promise<Vocabulary[]> {
  return invoke<Vocabulary[]>("list_vocabularies", { projectPath });
}

export function listVocabularyItems(
  projectPath: string,
  vocabularyId: string,
): Promise<VocabularyItem[]> {
  return invoke<VocabularyItem[]>("list_vocabulary_items", {
    projectPath,
    vocabularyId,
  });
}

export function createVocabulary(
  projectPath: string,
  name: string,
): Promise<Vocabulary> {
  return invoke<Vocabulary>("create_vocabulary", { projectPath, name });
}

export function createVocabularyItem(
  projectPath: string,
  vocabularyId: string,
  label: string,
): Promise<VocabularyItem> {
  return invoke<VocabularyItem>("create_vocabulary_item", {
    projectPath,
    vocabularyId,
    label,
  });
}

export function renameVocabularyItem(
  projectPath: string,
  itemId: string,
  label: string,
): Promise<VocabularyItem> {
  return invoke<VocabularyItem>("rename_vocabulary_item", {
    projectPath,
    itemId,
    label,
  });
}

export function deleteVocabularyItem(
  projectPath: string,
  itemId: string,
): Promise<void> {
  return invoke<void>("delete_vocabulary_item", { projectPath, itemId });
}

export function deleteVocabulary(
  projectPath: string,
  vocabularyId: string,
): Promise<void> {
  return invoke<void>("delete_vocabulary", { projectPath, vocabularyId });
}
