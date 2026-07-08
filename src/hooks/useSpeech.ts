"use client";
import { useCallback, useRef, useEffect, useState } from "react";

// Cache audio blob URLs per non rifetterli
const audioCache = new Map<string, string>();

export function useSpeech() {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [useNative, setUseNative] = useState(false); // fallback flag

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsSupported(true);
    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      const load = () => { const v = window.speechSynthesis.getVoices(); if (v.length) setVoices(v); };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const getBestVoice = useCallback((voices: SpeechSynthesisVoice[]) => {
    const priority = [
      (v: SpeechSynthesisVoice) => v.name === "Alice" && v.lang.startsWith("it"),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes("alice"),
      (v: SpeechSynthesisVoice) => v.lang === "it-IT" && v.localService,
      (v: SpeechSynthesisVoice) => v.lang.startsWith("it") && v.localService,
      (v: SpeechSynthesisVoice) => v.lang.startsWith("it"),
    ];
    for (const test of priority) { const f = voices.find(test); if (f) return f; }
    return null;
  }, []);

  // ── Fallback: Web Speech API (sistema) ──────────────────────────
  const speakNative = useCallback((text: string, rate = 0.78, pitch = 0.90) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\n/g, ". "));
    u.lang = "it-IT"; u.rate = rate; u.pitch = pitch; u.volume = 0.92;
    const v = getBestVoice(voices); if (v) u.voice = v;
    synth.speak(u);
  }, [voices, getBestVoice]);

  // ── Primaria: Google TTS via proxy ───────────────────────────────
  const speakViaAPI = useCallback(async (text: string, speed = "0.82"): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    try {
      // Ferma audio precedente
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }

      const cacheKey = `${text}|${speed}`;
      let blobUrl = audioCache.get(cacheKey);

      if (!blobUrl) {
        const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}&speed=${speed}`);
        if (!res.ok) return false;
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
        audioCache.set(cacheKey, blobUrl);
        // Limite cache a 30 voci
        if (audioCache.size > 30) {
          const first = audioCache.keys().next().value;
          if (first) { URL.revokeObjectURL(audioCache.get(first)!); audioCache.delete(first); }
        }
      }

      const audio = new Audio(blobUrl);
      audio.playbackRate = 1.0;
      audioRef.current = audio;
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── API pubblica ─────────────────────────────────────────────────

  // Testo lungo (istruzioni step) — Google TTS, fallback nativo
  const speakFull = useCallback(async (text: string) => {
    if (!isSupported) return;
    if (useNative) { speakNative(text, 0.78, 0.90); return; }
    const ok = await speakViaAPI(text, "0.82");
    if (!ok) { setUseNative(true); speakNative(text, 0.78, 0.90); }
  }, [isSupported, useNative, speakViaAPI, speakNative]);

  // Messaggio breve (inizio, pausa, fine)
  const speak = useCallback(async (text: string, options?: { rate?: number }) => {
    if (!isSupported) return;
    if (useNative) { speakNative(text, options?.rate ?? 0.78); return; }
    const ok = await speakViaAPI(text, "0.85");
    if (!ok) { setUseNative(true); speakNative(text, options?.rate ?? 0.78); }
  }, [isSupported, useNative, speakViaAPI, speakNative]);

  // Cue di respiro — sempre nativo (breve, frequente, cache non necessaria)
  const speakBreath = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth) return;
    if (synth.speaking) return; // non interrompere istruzioni
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT"; u.rate = 0.60; u.pitch = 0.85; u.volume = 0.75;
    const v = getBestVoice(voices); if (v) u.voice = v;
    synth.speak(u);
  }, [voices, getBestVoice]);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
  }, []);

  return { speak, speakFull, speakBreath, stop, isSupported };
}
