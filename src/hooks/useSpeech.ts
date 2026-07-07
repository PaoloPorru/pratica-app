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

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Sceglie la voce più gentile disponibile
  const getBestVoice = useCallback((voices: SpeechSynthesisVoice[]) => {
    // Priorità: Alice (iOS, femminile italiana), poi qualsiasi it-IT locale, poi it generico
    const priority = [
      (v: SpeechSynthesisVoice) => v.name === "Alice" && v.lang.startsWith("it"),
      (v: SpeechSynthesisVoice) => v.name.includes("Alice"),
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

  // Aggiunge pause naturali tra frasi per effetto meditativo
  const addPauses = (text: string): string => {
    return text
      .replace(/\.\s+/g, ". ... ")     // pausa dopo punto
      .replace(/,\s+/g, ", .. ")        // pausa dopo virgola
      .replace(/—/g, " ... ")           // pausa dopo em-dash
      .replace(/\n/g, " ... ");         // pausa dopo a capo
  };

  const speak = useCallback((text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    gentle?: boolean; // modalità extra-gentile per cue di respiro
  }) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();

    const processedText = addPauses(text);
    const u = new SpeechSynthesisUtterance(processedText);

    u.lang   = "it-IT";
    u.rate   = options?.gentle ? 0.68 : (options?.rate ?? 0.78); // lenta, meditativa
    u.pitch  = options?.gentle ? 0.88 : (options?.pitch ?? 0.92); // leggermente più bassa, calda
    u.volume = options?.volume ?? 0.95;

    const bestVoice = getBestVoice(voices);
    if (bestVoice) u.voice = bestVoice;

    synth.speak(u);
  }, [voices, getBestVoice]);

  // Versione per cue di respiro: singola parola, molto lenta e calma
  const speakBreath = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang   = "it-IT";
    u.rate   = 0.62;   // molto lenta
    u.pitch  = 0.85;   // calda e profonda
    u.volume = 0.85;   // leggermente più bassa

    const bestVoice = getBestVoice(voices);
    if (bestVoice) u.voice = bestVoice;

    synth.speak(u);
  }, [voices, getBestVoice]);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  return { speak, speakBreath, stop, isSupported };
}
