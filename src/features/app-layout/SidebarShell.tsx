import type { ReactNode } from "react";

import styles from "./SidebarShell.module.css";

type Props = {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Sidebar layout primitive: optional header, scrollable body,
 * optional footer pinned at the bottom. Used by HomeSidebar,
 * ProjectSidebar, SettingsSidebar to keep their chrome consistent.
 */
export function SidebarShell({ header, children, footer }: Props) {
  return (
    <aside className={styles.sidebar}>
      {header && <header className={styles.header}>{header}</header>}
      <div className={styles.body}>{children}</div>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </aside>
  );
}
