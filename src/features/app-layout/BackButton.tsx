import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import styles from "./BackButton.module.css";

/**
 * Goes back one step in the router history. Falls back to "/" when
 * there's nothing to go back to (e.g. user opened a deep link).
 */
export function BackButton() {
  const navigate = useNavigate();

  function handleClick() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      title="Back"
      aria-label="Back"
    >
      <ArrowLeft size={16} strokeWidth={1.75} />
    </button>
  );
}
