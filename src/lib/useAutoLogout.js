import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// 15 minutes idle → sign out
const IDLE_TIMEOUT = 15 * 60 * 1000;
// Warn 2 minutes before
const WARN_BEFORE = 2 * 60 * 1000;

const STORAGE_KEY = "hmc_last_activity";

export function useAutoLogout(enabled) {
  const [warning, setWarning] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setWarning(false);
      return;
    }

    // --- 1. On mount: if the timestamp is missing OR too old,
    //        treat this as a fresh session and reset it.
    //        Do NOT sign out on mount — that was the bug.
    const stored = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    const now = Date.now();
    const elapsed = Number.isFinite(stored) ? now - stored : 0;

    if (!Number.isFinite(stored) || elapsed >= IDLE_TIMEOUT) {
      // Fresh start — reset the clock
      localStorage.setItem(STORAGE_KEY, String(now));
    } else if (elapsed >= IDLE_TIMEOUT - WARN_BEFORE) {
      // In the warning window — show the warning
      setWarning(true);
    }

    // --- 2. Record user activity ---
    function recordActivity() {
      // Don't reset while warning is showing — only "Stay signed in" does that
      if (warning) return;
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    // --- 3. Listen for user activity ---
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    events.forEach((e) =>
      window.addEventListener(e, recordActivity, { passive: true })
    );

    function onVisible() {
      if (document.visibilityState === "visible" && !warning) {
        recordActivity();
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    // --- 4. Ticker: every 3 seconds, check how long it's been ---
    function tick() {
      const last = parseInt(localStorage.getItem(STORAGE_KEY), 10);
      if (!Number.isFinite(last)) {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        return;
      }

      const diff = Date.now() - last;

      if (diff >= IDLE_TIMEOUT) {
        // Time to sign out
        localStorage.removeItem(STORAGE_KEY);
        supabase.auth.signOut();
        return;
      }

      if (diff >= IDLE_TIMEOUT - WARN_BEFORE) {
        setWarning(true);
      }
    }

    const interval = setInterval(tick, 3000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, recordActivity));
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [enabled, warning]);

  function staySignedIn() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setWarning(false);
  }

  return { warning, staySignedIn };
}