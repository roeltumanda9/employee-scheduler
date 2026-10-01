import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

// Auto sign-out after 15 minutes of inactivity
const IDLE_TIMEOUT = 15 * 60 * 1000
// Warn the user 2 minutes before sign-out
const WARN_BEFORE = Math.min(2 * 60 * 1000, IDLE_TIMEOUT / 2);

export function useAutoLogout(enabled) {
  const [warning, setWarning] = useState(false);

  const warnTimer = useRef(null);
  const logoutTimer = useRef(null);

  // Use a ref for the "stay signed in" reset trigger.
  // When this changes, the effect re-runs and resets timers.
  const [resetTick, setResetTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setWarning(false);
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      return;
    }

    // Clear previous timers before scheduling new ones
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);

    // Schedule the warning
    warnTimer.current = setTimeout(() => {
      setWarning(true);
    }, IDLE_TIMEOUT - WARN_BEFORE);

    // Schedule the sign out
    logoutTimer.current = setTimeout(async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Auto-logout failed:", err);
      }
    }, IDLE_TIMEOUT);

    // ---- Activity tracking (only active while warning is OFF) ----
    function onActivity() {
      if (warning) return; // don't reset while warning is showing
      setResetTick((t) => t + 1);
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true })
    );

    function onVisible() {
      if (document.visibilityState === "visible" && !warning) {
        setResetTick((t) => t + 1);
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
    };
    // Rerun whenever:
    //   - enabled changes
    //   - warning changes (turn on / off)
    //   - resetTick changes (user stayed active)
  }, [enabled, warning, resetTick]);

  function staySignedIn() {
    setWarning(false);
    setResetTick((t) => t + 1);
  }

  return { warning, staySignedIn };
}