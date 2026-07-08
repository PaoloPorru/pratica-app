"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(typeof navigator !== "undefined" && "wakeLock" in navigator);
  }, []);

  const acquire = useCallback(async () => {
    if (!isSupported) return;
    try {
      lockRef.current = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
      setIsActive(true);
      // Se l'utente manda l'app in background e poi torna, riacquisisce
      lockRef.current.addEventListener("release", () => setIsActive(false));
    } catch {
      // Silenzioso — non supportato o negato
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (lockRef.current) {
      await lockRef.current.release();
      lockRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Riacquisisce se la pagina torna visibile (es. dopo blocco schermo)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && isActive && !lockRef.current) {
        acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isActive, acquire]);

  // Rilascia quando il componente viene smontato
  useEffect(() => () => { lockRef.current?.release(); }, []);

  return { acquire, release, isActive, isSupported };
}
