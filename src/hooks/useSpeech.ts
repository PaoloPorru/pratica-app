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
    // iOS: Alice è la voce italiana più naturale e morbida
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

  // Trasforma il testo in parlato naturale: aggiunge pause, ammorbidisce la punteggiatura
  const naturalize = (text: string): string => {
    return text
      .replace(/\./g, " .  ")          // pausa lunga dopo punto
      .replace(/,/g, " , ")            // pausa breve dopo virgola
      .replace(/:/g, " ,  ")           // pausa dopo due punti
      .replace(/—/g, "  ,  ")          // pausa dopo trattino lungo
      .replace(/\n/g, "  .  ")         // pausa dopo a capo
      .replace(/\((\d+)s\)/g, "")      // rimuove "(4s)" ecc.
      .replace(/×\d+/g, "")            // rimuove "×5"
      .replace(/\s{3,}/g, "  ")        // normalizza spazi multipli
      .trim();
  };

  // Parla un testo con i parametri più gentili
  const speak = useCallback((text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
  }) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();

    const u = new SpeechSynthesisUtterance(naturalize(text));
    u.lang   = "it-IT";
    u.rate   = options?.rate   ?? 0.75;  // lenta, calma
    u.pitch  = options?.pitch  ?? 0.90;  // voce calda, non acuta
    u.volume = options?.volume ?? 0.92;

    const v = getBestVoice(voices);
    if (v) u.voice = v;
    synth.speak(u);
  }, [voices, getBestVoice]);

  // Parla un cue di respiro — ancora più lenta e soffusa
  const speakBreath = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang   = "it-IT";
    u.rate   = 0.58;   // molto lenta
    u.pitch  = 0.82;   // profonda e calma
    u.volume = 0.80;   // soffusa

    const v = getBestVoice(voices);
    if (v) u.voice = v;
    synth.speak(u);
  }, [voices, getBestVoice]);

  // Parla testo lungo spezzandolo in frasi — più naturale per istruzioni lunghe
  const speakFull = useCallback((text: string) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.cancel();

    // Spezza per punto o virgola, parla ogni frase in sequenza
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const sentence of sentences) {
      const u = new SpeechSynthesisUtterance(naturalize(sentence));
      u.lang   = "it-IT";
      u.rate   = 0.72;
      u.pitch  = 0.90;
      u.volume = 0.92;
      const v = getBestVoice(voices);
      if (v) u.voice = v;
      synth.speak(u);
    }
  }, [voices, getBestVoice]);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  return { speak, speakBreath, speakFull, stop, isSupported };
}
