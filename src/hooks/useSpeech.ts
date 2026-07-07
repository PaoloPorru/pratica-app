"use client";
import { useCallback, useRef, useEffect, useState } from "react";

export function useSpeech() {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    synthRef.current = window.speechSynthesis;
    setIsSupported(true);
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = useCallback((text: string, options?: { rate?: number; pitch?: number; volume?: number }) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang   = "it-IT";
    u.rate   = options?.rate   ?? 0.85;
    u.pitch  = options?.pitch  ?? 1.0;
    u.volume = options?.volume ?? 1.0;
    const itVoice = voices.find(v => v.lang.startsWith("it") && v.localService)
                 ?? voices.find(v => v.lang.startsWith("it")) ?? null;
    if (itVoice) u.voice = itVoice;
    synth.speak(u);
  }, [voices]);

  const stop = useCallback(() => { synthRef.current?.cancel(); }, []);

  return { speak, stop, isSupported };
}
