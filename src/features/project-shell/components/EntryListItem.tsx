import { AlertTriangle } from "lucide-react";
import { NavLink } from "react-router-dom";

import type { Entry } from "../../../types";

import styles from "./EntryListItem.module.css";

type Props = { entry: Entry; hasBroken?: boolean };

export function EntryListItem({ entry, hasBroken }: Props) {
  return (
    <li>
      <NavLink
        to={`/project/entry/${entry.id}`}
        className={({ isActive }) =>
          isActive ? `${styles.item} ${styles.active}` : styles.item
        }
      >
        <span className={styles.name}>{entry.name || "(untitled)"}</span>
        {hasBroken && (
          <AlertTriangle
            size={12}
            strokeWidth={2.5}
            className={styles.brokenIcon}
            aria-label="Contains broken wikilinks"
          />
        )}
      </NavLink>
    </li>
  );
}
