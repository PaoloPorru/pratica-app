"use client";
import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch {
      // use initialValue
    }
    setHydrated(true);
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (e) {
        console.warn("useLocalStorage write failed:", e);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue, hydrated] as const;
}

export function useProfile() {
  const [profile, setProfile, hydrated] = useLocalStorage<null | import("@/lib/types").UserProfile>(
    "pratica:profile",
    null
  );
  return { profile, setProfile, hydrated };
}
