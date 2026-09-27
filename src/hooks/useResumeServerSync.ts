import { useEffect, useRef } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { useSpaceStore } from "@/store/useSpaceStore";
import { deleteResumeRemote, putResume } from "@/lib/space/api";
import type { ResumeData } from "@/types/resume";

const SAVE_DEBOUNCE_MS = 1200;

/**
 * After entering a space, keep Zustand resumes in sync with the server.
 * Server is source of truth on hydrate; local edits debounce-PUT.
 */
export function useResumeServerSync() {
  const entered = useSpaceStore((s) => s.entered);
  const resumes = useResumeStore((s) => s.resumes);
  const knownIds = useRef<Set<string>>(new Set());
  const lastPayload = useRef<Map<string, string>>(new Map());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const ready = useRef(false);

  useEffect(() => {
    if (!entered) {
      knownIds.current = new Set();
      lastPayload.current = new Map();
      ready.current = false;
      for (const timer of timers.current.values()) clearTimeout(timer);
      timers.current.clear();
      return;
    }

    const currentIds = new Set(Object.keys(resumes));

    // First snapshot after enter: record baseline, do not write back.
    if (!ready.current) {
      knownIds.current = currentIds;
      for (const [id, resume] of Object.entries(resumes)) {
        lastPayload.current.set(id, JSON.stringify(resume));
      }
      ready.current = true;
      return;
    }

    // Deletes
    for (const id of knownIds.current) {
      if (!currentIds.has(id)) {
        lastPayload.current.delete(id);
        const prevTimer = timers.current.get(id);
        if (prevTimer) {
          clearTimeout(prevTimer);
          timers.current.delete(id);
        }
        void deleteResumeRemote(id).catch((err) =>
          console.warn("[space-sync] delete failed", id, err)
        );
      }
    }

    // Upserts for changed resumes only
    for (const [id, resume] of Object.entries(resumes)) {
      const serialized = JSON.stringify(resume);
      if (lastPayload.current.get(id) === serialized) continue;

      const prevTimer = timers.current.get(id);
      if (prevTimer) clearTimeout(prevTimer);
      const timer = setTimeout(() => {
        const latest = useResumeStore.getState().resumes[id];
        if (!latest) return;
        const body = JSON.stringify(latest);
        lastPayload.current.set(id, body);
        void putResume(latest as ResumeData).catch((err) =>
          console.warn("[space-sync] put failed", id, err)
        );
        timers.current.delete(id);
      }, SAVE_DEBOUNCE_MS);
      timers.current.set(id, timer);
    }

    knownIds.current = currentIds;
  }, [entered, resumes]);

  useEffect(() => {
    return () => {
      for (const timer of timers.current.values()) clearTimeout(timer);
      timers.current.clear();
    };
  }, []);
}

/** Replace local resume map with server data (call after enter/session). */
export function hydrateResumesFromServer(
  resumeData: Record<string, ResumeData> | undefined
) {
  const map = resumeData || {};
  useResumeStore.setState((state) => {
    const activeId =
      state.activeResumeId && map[state.activeResumeId]
        ? state.activeResumeId
        : Object.keys(map)[0] || null;
    return {
      ...state,
      resumes: map,
      activeResumeId: activeId,
      activeResume: activeId ? map[activeId] : null,
      history: {},
      future: {},
    };
  });
}
