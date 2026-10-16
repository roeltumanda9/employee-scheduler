
import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

// 15 minutes idle → sign out
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Warn 2 minutes before
const WARN_BEFORE = 2 * 60 * 1000;  // Warn 2 minutes before logout

const STORAGE_KEY = "hmc_last_activity";

export function useAutoLogout(enabled) {
  const [warning, setWarning] = useState(false);  
  const warningRef = useRef(false);

  // Keep event listeners synchronized with the latest warning state.
  warningRef.current = warning;

  useEffect(() => {
    if (!enabled) {
      setWarning(false);
      warningRef.current = false;
      return;
    }

    let disposed = false;
    let logoutStarted = false;

    function showWarning() {
      warningRef.current = true;
      setWarning(true);
    }

    function recordActivity() {
      if (disposed || logoutStarted || warningRef.current) return;

      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    async function signOutForInactivity() {
      if (disposed || logoutStarted) return;

      logoutStarted = true;
      localStorage.removeItem(STORAGE_KEY);

      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }
      } catch (error) {
        if (disposed) return;

        console.error("Automatic sign-out failed:", error);

        // Keep the session recoverable if sign-out fails.
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        logoutStarted = false;
        showWarning();
      }
    }

    // Check the previous activity timestamp.
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    const now = Date.now();

    if (!Number.isFinite(stored) || stored <= 0) {
  localStorage.setItem(STORAGE_KEY, String(now));
} else {
  const elapsed = Math.max(0, now - stored);

  if (elapsed >= IDLE_TIMEOUT) {
    void signOutForInactivity();
  } else if (elapsed >= IDLE_TIMEOUT - WARN_BEFORE) {
    showWarning();
  } else {
    warningRef.current = false;
    setWarning(false);
  }
}

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, {
        passive: true,
      });
    });

    function onVisible() {
      if (
        document.visibilityState === "visible" &&
        !warningRef.current
      ) {
        recordActivity();
      }
    }

    document.addEventListener("visibilitychange", onVisible);

    const interval = setInterval(() => {
      if (disposed || logoutStarted) return;

      const last = Number(localStorage.getItem(STORAGE_KEY));

      if (!Number.isFinite(last) || last <= 0) {
        // Do not silently restart the timer if the timestamp disappears.
        void signOutForInactivity();
        return;
      }

      const elapsed = Math.max(0, Date.now() - last);

      if (elapsed >= IDLE_TIMEOUT) {
        void signOutForInactivity();
      } else if (elapsed >= IDLE_TIMEOUT - WARN_BEFORE) {
        showWarning();
      }
    }, 3000);

    return () => {
      disposed = true;

      events.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });

      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [enabled]);

  function staySignedIn() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    warningRef.current = false;
    setWarning(false);
  }

  return { warning, staySignedIn };
}
