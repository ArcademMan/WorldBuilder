import { Link, NavLink } from "react-router-dom";
import { Home, Palette, Layout } from "lucide-react";

import { BackButton } from "../app-layout/BackButton";
import { SidebarShell } from "../app-layout/SidebarShell";

import styles from "./SettingsSidebar.module.css";

export function SettingsSidebar() {
  return (
    <SidebarShell
      header={
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Settings</h1>
          <BackButton />
        </div>
      }
      footer={
        <Link to="/" className={styles.footerLink}>
          <Home size={15} strokeWidth={1.75} />
          <span>Home</span>
        </Link>
      }
    >
      <nav className={styles.nav}>
        <NavLink
          to="/settings/theme"
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
          }
        >
          <Palette size={16} strokeWidth={1.75} />
          <span>Theme</span>
        </NavLink>
        <NavLink
          to="/settings/appearance"
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
          }
        >
          <Layout size={16} strokeWidth={1.75} />
          <span>Appearance</span>
        </NavLink>
      </nav>
    </SidebarShell>
  );
}
