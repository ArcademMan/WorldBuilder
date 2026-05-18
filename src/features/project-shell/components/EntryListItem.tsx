import { NavLink } from "react-router-dom";

import type { Entry } from "../../../types";

import styles from "./EntryListItem.module.css";

type Props = { entry: Entry };

export function EntryListItem({ entry }: Props) {
  return (
    <li>
      <NavLink
        to={`/project/entry/${entry.id}`}
        className={({ isActive }) =>
          isActive ? `${styles.item} ${styles.active}` : styles.item
        }
      >
        <span className={styles.name}>{entry.name || "(untitled)"}</span>
      </NavLink>
    </li>
  );
}
