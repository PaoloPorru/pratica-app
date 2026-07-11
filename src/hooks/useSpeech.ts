"use client";
import { useCallback, useRef, useEffect, useState } from "react";

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

export function useSpeech() {
  // ── AudioContext (non ha restrizioni iOS dopo unlock) ────────────
  const ctxRef    = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // ── Web Speech (fallback + cue respiro) ─────────────────────────
  const synthRef  = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsSupported(true);
    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ── Sblocca AudioContext — deve essere chiamato in un click handler
  const unlockAudio = useCallback(async () => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      // Riproduce un secondo di silenzio per sbloccare definitivamente
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      src.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("AudioContext unlock failed:", e);
    }
  }, []);

  // ── Ferma audio corrente ─────────────────────────────────────────
  const stopAudioContext = useCallback(() => {
    try {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
    } catch {}
  }, []);

  // ── Voce Web Speech (fallback) ───────────────────────────────────
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

  // ── Google TTS via AudioContext ──────────────────────────────────
  const speakViaAPI = useCallback(async (text: string, speed = "0.82"): Promise<boolean> => {
    const ctx = ctxRef.current;
    if (!ctx) return false;

    try {
      // Riprendi se sospeso
      if (ctx.state === "suspended") await ctx.resume();

      // Ferma eventuale audio precedente
      stopAudioContext();

      // Fetch MP3 da proxy
      const url = `/api/tts?text=${encodeURIComponent(cleanForItalian(text))}&speed=${speed}`;
      const res = await fetch(url);
      if (!res.ok) return false;

      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      // Crea nuovo source e riproduci
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => { sourceRef.current = null; };
      source.start(0);
      sourceRef.current = source;
      return true;
    } catch (e) {
      console.warn("AudioContext TTS failed:", e);
      return false;
    }
  }, [stopAudioContext]);

  // ── API pubblica ─────────────────────────────────────────────────

  const speakFull = useCallback(async (text: string) => {
    const ok = await speakViaAPI(text, "0.82");
    if (!ok) speakNative(text, 0.78, 0.90);
  }, [speakViaAPI, speakNative]);

  const speak = useCallback(async (text: string, options?: { rate?: number }) => {
    const ok = await speakViaAPI(text, "0.85");
    if (!ok) speakNative(text, options?.rate ?? 0.78);
  }, [speakViaAPI, speakNative]);

  // Cue respiro — Web Speech, non interrompe TTS in corso
  const speakBreath = useCallback((text: string) => {
    const synth = synthRef.current;
    // Non interrompere se AudioContext sta riproducendo
    if (sourceRef.current) return;
    if (!synth || synth.speaking) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT"; u.rate = 0.60; u.pitch = 0.85; u.volume = 0.72;
    const vs = voicesRef.current;
    const voice = vs.find(v => v.lang.startsWith("it")) ?? null;
    if (voice) u.voice = voice;
    synth.speak(u);
  }, []);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    stopAudioContext();
  }, [stopAudioContext]);

  // Ref stabile per uso nel tick imperativo del timer
  const speakFullRef = useRef(speakFull);
  useEffect(() => { speakFullRef.current = speakFull; }, [speakFull]);

  return { speak, speakFull, speakFullRef, speakBreath, stop, unlockAudio, isSupported };
}
