import type { ReactNode } from "react";

import styles from "./AppShell.module.css";

type Props = {
  sidebar: ReactNode;
  /** Optional bar pinned above the scrollable content (e.g. tab bar). */
  topbar?: ReactNode;
  children: ReactNode;
};

/**
 * Reusable two-pane layout: fixed sidebar on the left,
 * scrollable main on the right. An optional topbar sits above the
 * scrollable area, anchored to the top of the main pane.
 */
export function AppShell({ sidebar, topbar, children }: Props) {
  return (
    <div className={styles.shell}>
      {sidebar}
      <div className={styles.right}>
        {topbar}
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
