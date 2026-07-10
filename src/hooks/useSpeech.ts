"use client";
import { useCallback, useRef, useEffect, useState } from "react";

// Pulizia testo per pronuncia italiana naturale
function cleanForItalian(text: string): string {
  return text
    .replace(/\((\d+)s\)/g, (_, n) => `per ${n} secondi`)
    .replace(/(\d+)s\b/g, (_, n) => `${n} secondi`)
    .replace(/[×x](\d+)/gi, (_, n) => `per ${n} volte`)
    .replace(/↑/g, "su").replace(/↓/g, "giù")
    .replace(/—/g, ", ").replace(/ - /g, ", ")
    .replace(/\n+/g, ". ")
    .replace(/\bmin\b/g, "minuti").replace(/\bsec\b/g, "secondi")
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[^\w\s.,!?;:àèéìíîòóùú'-]/g, " ")
    .replace(/\s{2,}/g, " ").replace(/\.\s*\./g, ".").trim();
}

// Silenzio minimo in base64 per sbloccare audio iOS
const SILENCE_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

export function useSpeech() {
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const synthRef   = useRef<SpeechSynthesis | null>(null);
  const voicesRef  = useRef<SpeechSynthesisVoice[]>([]);
  const unlockedRef = useRef(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsSupported(true);

    // Crea UN SOLO elemento audio e lo riusa sempre
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    // Carica voci Web Speech (fallback)
    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }

    return () => {
      audio.pause();
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ── Sblocca audio iOS con gesto utente ─────────────────────────
  // Chiamare PRIMA di avviare il timer (dentro un click handler)
  const unlockAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || unlockedRef.current) return;
    try {
      audio.src = SILENCE_WAV;
      await audio.play();
      audio.pause();
      unlockedRef.current = true;
    } catch {
      // Non critico — fallback a Web Speech
    }
  }, []);

  // ── Voce nativa (fallback sempre disponibile) ───────────────────
  const speakNative = useCallback((text: string, rate = 0.78, pitch = 0.90) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(cleanForItalian(text));
    u.lang = "it-IT"; u.rate = rate; u.pitch = pitch; u.volume = 0.92;
    const vs = voicesRef.current;
    const voice =
      vs.find(v => v.name === "Alice" && v.lang.startsWith("it")) ??
      vs.find(v => v.lang === "it-IT" && v.localService) ??
      vs.find(v => v.lang.startsWith("it")) ?? null;
    if (voice) u.voice = voice;
    synth.speak(u);
  }, []);

  // ── Google TTS via proxy — riusa sempre lo stesso audio element ─
  const speakViaAPI = useCallback(async (text: string, speed = "0.82"): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      audio.pause();
      const url = `/api/tts?text=${encodeURIComponent(cleanForItalian(text))}&speed=${speed}`;
      audio.src = url;
      audio.load();
      await audio.play(); // funziona perché l'elemento è già sbloccato da unlockAudio()
      return true;
    } catch (e) {
      console.warn("TTS API failed:", e);
      return false;
    }
  }, []);

  // ── API pubblica ─────────────────────────────────────────────────

  // Istruzione completa dello step
  const speakFull = useCallback(async (text: string) => {
    const ok = await speakViaAPI(text, "0.82");
    if (!ok) speakNative(text, 0.78, 0.90);
  }, [speakViaAPI, speakNative]);

  // Messaggio breve (inizio, pausa, fine)
  const speak = useCallback(async (text: string, options?: { rate?: number }) => {
    const ok = await speakViaAPI(text, "0.85");
    if (!ok) speakNative(text, options?.rate ?? 0.78);
  }, [speakViaAPI, speakNative]);

  // Cue di respiro — Web Speech, non interrompe audio in corso
  const speakBreath = useCallback((text: string) => {
    const audio = audioRef.current;
    if (audio && !audio.paused) return; // non interrompere TTS
    const synth = synthRef.current;
    if (!synth || synth.speaking) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT"; u.rate = 0.60; u.pitch = 0.85; u.volume = 0.75;
    const vs = voicesRef.current;
    const voice = vs.find(v => v.lang.startsWith("it")) ?? null;
    if (voice) u.voice = voice;
    synth.speak(u);
  }, []);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }
  }, []);

  // Ref stabile per uso in tick imperativo
  const speakFullRef = useRef(speakFull);
  useEffect(() => { speakFullRef.current = speakFull; }, [speakFull]);

  return { speak, speakFull, speakFullRef, speakBreath, stop, unlockAudio, isSupported };
}
