import { Link } from "react-router-dom";

import { useCurrentProject } from "../../hooks/use-current-project";

/**
 * Stub shell shown after a project is opened. Phase 2 turns this into
 * the real layout (sidebar + entry editor + graph view).
 */
export function ProjectShellPage() {
  const { project } = useCurrentProject();

  if (!project) {
    return (
      <main style={{ padding: "var(--space-8)" }}>
        <p>No project is open.</p>
        <Link to="/">← Back to project picker</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: "var(--space-8)", maxWidth: 820, margin: "0 auto" }}>
      <h1>{project.meta.name}</h1>
      <p style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
        {project.path}
      </p>
      <dl style={{ marginTop: "var(--space-6)" }}>
        <dt style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Format version</dt>
        <dd style={{ margin: "0 0 var(--space-3) 0" }}>{project.meta.formatVersion}</dd>
        <dt style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Created</dt>
        <dd style={{ margin: 0 }}>{project.meta.createdAt}</dd>
      </dl>
      <p style={{ marginTop: "var(--space-8)" }}>
        <Link to="/">← Back to project picker</Link>
      </p>
    </main>
  );
}
