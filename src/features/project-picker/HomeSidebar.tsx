import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

import { SidebarShell } from "../app-layout/SidebarShell";

import styles from "./HomeSidebar.module.css";

export function HomeSidebar() {
  return (
    <SidebarShell
      header={
        <>
          <h1 className={styles.brand}>WorldBuilder</h1>
          <p className={styles.tagline}>Your world, your rules.</p>
        </>
      }
      footer={
        <Link to="/settings" className={styles.footerLink}>
          <Settings size={15} strokeWidth={1.75} />
          <span>Settings</span>
        </Link>
      }
    >
      <div className={styles.spacer} />
    </SidebarShell>
  );
}
