// Global "live pulse" — a monotonically increasing tick that any surface can
// subscribe to for cross-tab, near-real-time refresh cues. In the interim
// (before Supabase realtime channels are wired), a BroadcastChannel keeps
// every open tab in sync and a 15s heartbeat drives the tick.
//
// UK tender data changes constantly (Contracts Finder / Find a Tender publish
// throughout the working day). Surfaces call `useLivePulse()` and re-fetch,
// re-derive, or re-render on each tick. When Cloud lands, replace the
// heartbeat with `supabase.channel(...).on(...)` — the API stays identical.

import { useEffect, useSyncExternalStore } from "react";

const HEARTBEAT_MS = 15_000;
const CHANNEL_NAME = "bidsense-live-pulse";

interface PulseState {
  tick: number;
  ts: number;
}

let state: PulseState = { tick: 0, ts: Date.now() };
const listeners = new Set<() => void>();
let heartbeat: ReturnType<typeof setInterval> | null = null;
let channel: BroadcastChannel | null = null;
let started = false;

function emit() {
  listeners.forEach((l) => l());
}

function bump(source: "local" | "remote") {
  state = { tick: state.tick + 1, ts: Date.now() };
  if (source === "local" && channel) {
    try {
      channel.postMessage({ type: "pulse", tick: state.tick, ts: state.ts });
    } catch {
      /* ignore */
    }
  }
  emit();
}

function ensureStarted() {
  if (started || typeof window === "undefined") return;
  started = true;
  if ("BroadcastChannel" in window) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (evt) => {
        if (evt.data?.type === "pulse") bump("remote");
      };
    } catch {
      channel = null;
    }
  }
  heartbeat = setInterval(() => bump("local"), HEARTBEAT_MS);
  // Bump when the tab regains focus — the user is looking again, refresh feeds.
  window.addEventListener("focus", () => bump("local"));
  window.addEventListener("online", () => bump("local"));
}

function subscribe(l: () => void) {
  ensureStarted();
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot(): PulseState {
  return state;
}

function getServerSnapshot(): PulseState {
  return { tick: 0, ts: 0 };
}

export function useLivePulse(): PulseState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// For code that mutates shared state and wants every other tab to notice.
export function nudgeLivePulse() {
  ensureStarted();
  bump("local");
}

// Human-friendly "seconds ago" reader, ticks every second when mounted.
export function useLiveClock(): number {
  const pulse = useLivePulse();
  useEffect(() => {
    const i = setInterval(() => {
      state = { ...state, ts: state.ts }; // no-op, real re-render below
      emit();
    }, 1000);
    return () => clearInterval(i);
  }, []);
  return pulse.ts;
}