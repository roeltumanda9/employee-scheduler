import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

// 30 minutes in milliseconds — change to whatever you want
const IDLE_TIMEOUT = 15 * 60 * 1000;        // 15 minutes
const WARN_BEFORE = 2 * 60 * 1000;          // warn 2 min before

// Where we store the last activity timestamp
const STORAGE_KEY = "hmc_last_activity";

export function useAutoLogout(enabled) {
  const [warning, setWarning] = useState(false);
  const logoutTimer = useRef(null);
  const warnTimer = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setWarning(false);
      return;
    }

    // --- 1. On mount, check if the user has been away too long ---
    const stored = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    if (Number.isFinite(stored)) {
      const elapsed = Date.now() - stored;
      if (elapsed >= IDLE_TIMEOUT) {
        // Too long — sign out immediately
        supabase.auth.signOut();
        return;
      }
      if (elapsed >= IDLE_TIMEOUT - WARN_BEFORE) {
        // In the warning window — show the warning
        setWarning(true);
      }
    } else {
      // First load — set the timestamp
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    // --- 2. Helper to record activity ---
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

    // --- 4. Ticker: every few seconds, check how long it's been ---
    function tick() {
      const last = parseInt(localStorage.getItem(STORAGE_KEY), 10);
      if (!Number.isFinite(last)) {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        return;
      }

      const elapsed = Date.now() - last;

      if (elapsed >= IDLE_TIMEOUT) {
        // Too long — sign out
        supabase.auth.signOut();
        return;
      }

      if (elapsed >= IDLE_TIMEOUT - WARN_BEFORE) {
        setWarning(true);
      }
    }

    // Check every 3 seconds
    const interval = setInterval(tick, 3000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, recordActivity));
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      if (warnTimer.current) clearTimeout(warnTimer.current);
    };
  }, [enabled, warning]);

  function staySignedIn() {
    // Reset the timestamp and hide the warning
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setWarning(false);
  }

  return { warning, staySignedIn };
}