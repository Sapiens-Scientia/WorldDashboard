import { useCallback, useEffect, useRef, useState } from "react";
import snapshot from "../data/snapshot.json";
const STORAGE_KEY = "world-dashboard-indicators-v1";
const seed = { ...snapshot, sources: [], offline: false };
function initialData() {
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (cached?.observations && typeof cached.checkedAt === "string")
      return {
        ...seed,
        ...cached,
        observations: { ...seed.observations, ...cached.observations },
        sources: [],
        offline: false,
      };
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
  return seed;
}
export function useMetrics() {
  const [data, setData] = useState(initialData),
    [loading, setLoading] = useState(false);
  const request = useRef(null);
  const refresh = useCallback(async (force = true) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 22000);
    setLoading(true);
    try {
      const response = await fetch(`/api/metrics${force ? "?refresh=1" : ""}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Data service unavailable");
      const next = await response.json();
      if (!next.observations || !Array.isArray(next.sources))
        throw new Error("Invalid data response");
      setData({ ...next, offline: false });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* Optional cache only. */
      }
    } catch {
      if (request.current === controller)
        setData((previous) => ({ ...previous, offline: true }));
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        setLoading(false);
        request.current = null;
      }
    }
  }, []);
  useEffect(() => {
    refresh(false);
    const timer = setInterval(() => {
      if (!document.hidden) refresh(false);
    }, 15 * 60000);
    return () => {
      request.current?.abort();
      request.current = null;
      clearInterval(timer);
    };
  }, [refresh]);
  return { data, loading, refresh };
}
export function usableObservation(id, observation, now) {
  if (
    id === "quakes" &&
    (!observation?.generatedAt ||
      +now - Date.parse(observation.generatedAt) > 2 * 3600000)
  )
    return {
      ...observation,
      value: null,
      points: [],
      period: "Feed unavailable",
      status: "unavailable",
    };
  return observation;
}
