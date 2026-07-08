"use client";
import { useCallback, useRef, useEffect, useState } from "react";

const audioCache = new Map<string, string>();

// ── Pulizia testo per pronuncia italiana naturale ────────────────
function cleanForItalian(text: string): string {
  return text
    // Espandi notazioni tecniche
    .replace(/\((\d+)s\)/g, (_, n) => `per ${n} secondi`)
    .replace(/(\d+)s\b/g, (_, n) => `${n} secondi`)
    .replace(/[×x](\d+)/gi, (_, n) => `per ${n} volte`)
    // Simboli freccia
    .replace(/↑/g, "su")
    .replace(/↓/g, "giù")
    // Trattini e dash → pausa
    .replace(/—/g, ", ")
    .replace(/ - /g, ", ")
    // A capo → pausa
    .replace(/\n+/g, ". ")
    // Abbreviazioni comuni
    .replace(/\bmin\b/g, "minuti")
    .replace(/\bsec\b/g, "secondi")
    // Rimuovi emoji e caratteri speciali
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[^\w\s.,!?;:àèéìíîòóùú'-]/g, " ")
    // Normalizza spazi
    .replace(/\s{2,}/g, " ")
    .replace(/\.\s*\./g, ".")
    .trim();
}

export function useSpeech() {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [useNative, setUseNative] = useState(false);

  // Ref per evitare stale closure negli effect del timer
  const useNativeRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsSupported(true);
    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      const load = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length) { setVoices(v); voicesRef.current = v; }
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => { if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => { useNativeRef.current = useNative; }, [useNative]);

  const getBestVoice = useCallback(() => {
    const vs = voicesRef.current;
    const priority = [
      (v: SpeechSynthesisVoice) => v.name === "Alice" && v.lang.startsWith("it"),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes("alice"),
      (v: SpeechSynthesisVoice) => v.lang === "it-IT" && v.localService,
      (v: SpeechSynthesisVoice) => v.lang.startsWith("it") && v.localService,
      (v: SpeechSynthesisVoice) => v.lang.startsWith("it"),
    ];
    for (const test of priority) { const f = vs.find(test); if (f) return f; }
    return null;
  }, []);

  // ── Web Speech fallback ──────────────────────────────────────────
  const speakNative = useCallback((text: string, rate = 0.78, pitch = 0.90) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(cleanForItalian(text));
    u.lang = "it-IT"; u.rate = rate; u.pitch = pitch; u.volume = 0.92;
    const v = getBestVoice(); if (v) u.voice = v;
    synth.speak(u);
  }, [getBestVoice]);

  // ── Google TTS via proxy ─────────────────────────────────────────
  const speakViaAPI = useCallback(async (text: string, speed = "0.82"): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      const cleaned = cleanForItalian(text);
      const cacheKey = `${cleaned}|${speed}`;
      let blobUrl = audioCache.get(cacheKey);
      if (!blobUrl) {
        const res = await fetch(`/api/tts?text=${encodeURIComponent(cleaned)}&speed=${speed}`);
        if (!res.ok) return false;
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
        audioCache.set(cacheKey, blobUrl);
        if (audioCache.size > 40) {
          const first = audioCache.keys().next().value;
          if (first) { URL.revokeObjectURL(audioCache.get(first)!); audioCache.delete(first); }
        }
      }
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      await audio.play();
      return true;
    } catch { return false; }
  }, []);

  // ── Ref stabili usati negli effect del timer (evita stale closure) ──
  const speakNativeRef = useRef(speakNative);
  const speakViaAPIRef = useRef(speakViaAPI);
  useEffect(() => { speakNativeRef.current = speakNative; }, [speakNative]);
  useEffect(() => { speakViaAPIRef.current = speakViaAPI; }, [speakViaAPI]);

  // ── API pubblica — usa sempre i ref per stabilità ────────────────

  const speakFull = useCallback(async (text: string) => {
    if (useNativeRef.current) { speakNativeRef.current(text, 0.78, 0.90); return; }
    const ok = await speakViaAPIRef.current(text, "0.82");
    if (!ok) { useNativeRef.current = true; setUseNative(true); speakNativeRef.current(text, 0.78, 0.90); }
  }, []); // dipendenze vuote — usa sempre i ref aggiornati

  const speak = useCallback(async (text: string, options?: { rate?: number }) => {
    if (useNativeRef.current) { speakNativeRef.current(text, options?.rate ?? 0.78); return; }
    const ok = await speakViaAPIRef.current(text, "0.85");
    if (!ok) { useNativeRef.current = true; setUseNative(true); speakNativeRef.current(text, options?.rate ?? 0.78); }
  }, []); // dipendenze vuote — usa sempre i ref aggiornati

  const speakBreath = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth || synth.speaking) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT"; u.rate = 0.60; u.pitch = 0.85; u.volume = 0.75;
    const v = getBestVoice(); if (v) u.voice = v;
    synth.speak(u);
  }, [getBestVoice]);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
  }, []);

  // Espone speakFull come ref stabile per usarlo negli effect del timer
  const speakFullRef = useRef(speakFull);
  useEffect(() => { speakFullRef.current = speakFull; }, [speakFull]);

  return { speak, speakFull, speakFullRef, speakBreath, stop, isSupported };
}
