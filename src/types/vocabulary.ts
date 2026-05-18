/**
 * Shared lookup tables (tags, species, occupations, …). Stored in the
 * project's SQLite database (`vocabularies.db`).
 *
 * Renaming a `VocabularyItem` propagates everywhere automatically
 * because referencing entries store the immutable `id`, not the label.
 */
export type Vocabulary = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type VocabularyItem = {
  id: string;
  vocabularyId: string;
  label: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Id of the project-wide tags vocabulary that every project ships with.
 * Mirrored in src-tauri/src/domain/vocabulary.rs.
 */
export const SYSTEM_TAGS_VOCAB_ID = "tags";
