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
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const getBestVoice = useCallback((voices: SpeechSynthesisVoice[]) => {
    const priority = [
      (v: SpeechSynthesisVoice) => v.name === "Alice" && v.lang.startsWith("it"),
      (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes("alice"),
      (v: SpeechSynthesisVoice) => v.lang === "it-IT" && v.localService,
      (v: SpeechSynthesisVoice) => v.lang.startsWith("it") && v.localService,
      (v: SpeechSynthesisVoice) => v.lang.startsWith("it"),
    ];
    for (const test of priority) {
      const found = voices.find(test);
      if (found) return found;
    }
    return null;
  }, []);

  // Aggiunge pause naturali tra frasi
  const naturalize = (text: string): string =>
    text
      .replace(/\.\s*/g, ". ")
      .replace(/,\s*/g, ", ")
      .replace(/:\s*/g, ": ")
      .replace(/—/g, ", ")
      .replace(/\n/g, ". ")
      .replace(/\(\d+s\)/g, "")  // rimuove "(4s)"
      .replace(/x\d+/gi, "")     // rimuove "x5"
      .trim();

  // Voce principale — una sola utterance (più affidabile su iOS)
  const speakFull = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();

    const u = new SpeechSynthesisUtterance(naturalize(text));
    u.lang   = "it-IT";
    u.rate   = 0.72;
    u.pitch  = 0.90;
    u.volume = 0.92;
    const v = getBestVoice(voices);
    if (v) u.voice = v;
    synth.speak(u);
  }, [voices, getBestVoice]);

  // Voce leggera per messaggi brevi
  const speak = useCallback((text: string, options?: { rate?: number; pitch?: number }) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();

    const u = new SpeechSynthesisUtterance(naturalize(text));
    u.lang   = "it-IT";
    u.rate   = options?.rate  ?? 0.75;
    u.pitch  = options?.pitch ?? 0.90;
    u.volume = 0.90;
    const v = getBestVoice(voices);
    if (v) u.voice = v;
    synth.speak(u);
  }, [voices, getBestVoice]);

  // Cue di respiro — NON cancella se sta già parlando
  const speakBreath = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth) return;
    if (synth.speaking) return; // non interrompere istruzioni in corso

    const u = new SpeechSynthesisUtterance(text);
    u.lang   = "it-IT";
    u.rate   = 0.58;
    u.pitch  = 0.82;
    u.volume = 0.78;
    const v = getBestVoice(voices);
    if (v) u.voice = v;
    synth.speak(u);
  }, [voices, getBestVoice]);

  const stop = useCallback(() => { synthRef.current?.cancel(); }, []);

  return { speak, speakFull, speakBreath, stop, isSupported };
}
