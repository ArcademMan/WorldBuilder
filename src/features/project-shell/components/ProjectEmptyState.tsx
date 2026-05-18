import { Link } from "react-router-dom";

type Props = {
  message?: string;
  showBackLink?: boolean;
};

/**
 * Placeholder shown on the right pane when no entry is selected
 * (or as a fallback if the project context is missing).
 */
export function ProjectEmptyState({
  message = "Select an entry from the sidebar, or create a new one.",
  showBackLink = false,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-3)",
        height: "100%",
        color: "var(--color-text-muted)",
        padding: "var(--space-6)",
        textAlign: "center",
      }}
    >
      <p style={{ margin: 0 }}>{message}</p>
      {showBackLink && <Link to="/">← Back to projects</Link>}
    </div>
  );
}
