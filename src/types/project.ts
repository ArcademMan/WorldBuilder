/**
 * Metadata stored at `<project>/worldbuilder.json`.
 * Marks a folder as a WorldBuilder project and pins its on-disk format.
 */
export type Project = {
  formatVersion: number;
  name: string;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
};

/**
 * Pointer to a previously opened project. Persisted by the app
 * (outside of any project folder) to power the "recent projects" list.
 */
export type RecentProject = {
  /** Absolute path to the project folder. */
  path: string;
  name: string;
  /** ISO 8601 timestamp of the last successful open. */
  lastOpenedAt: string;
};
