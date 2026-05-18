import { useEffect, useState } from "react";

import * as api from "../lib/api";

/**
 * Module-level cache: (projectPath::id) → object URL.
 *
 * Object URLs are cheap and there's no point re-fetching the same asset
 * across mounts. We never revoke them — the lifetime of the cache equals
 * the lifetime of the document, which for a desktop app is the session.
 */
const urlCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function cacheKey(projectPath: string, id: string) {
  return `${projectPath}::${id}`;
}

async function fetchUrl(projectPath: string, id: string): Promise<string> {
  const key = cacheKey(projectPath, id);
  const cached = urlCache.get(key);
  if (cached) return cached;
  const pending = inflight.get(key);
  if (pending) return pending;

  const p = (async () => {
    const { mimeType, bytes } = await api.readAsset(projectPath, id);
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    urlCache.set(key, url);
    inflight.delete(key);
    return url;
  })();
  inflight.set(key, p);
  return p;
}

type State = {
  url: string | null;
  loading: boolean;
  error: string | null;
};

/**
 * Loads `id` from the project's asset store and returns a Blob URL
 * suitable for an <img>. `id === null` yields a no-op idle state.
 */
export function useAssetUrl(projectPath: string, id: string | null): State {
  const [state, setState] = useState<State>(() => {
    if (!id) return { url: null, loading: false, error: null };
    const cached = urlCache.get(cacheKey(projectPath, id));
    return cached
      ? { url: cached, loading: false, error: null }
      : { url: null, loading: true, error: null };
  });

  useEffect(() => {
    if (!id) {
      setState({ url: null, loading: false, error: null });
      return;
    }
    const cached = urlCache.get(cacheKey(projectPath, id));
    if (cached) {
      setState({ url: cached, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ url: null, loading: true, error: null });
    fetchUrl(projectPath, id)
      .then((url) => {
        if (!cancelled) setState({ url, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled)
          setState({ url: null, loading: false, error: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [projectPath, id]);

  return state;
}
