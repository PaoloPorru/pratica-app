"use client";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getRoutineById, formatDuration, cn, getAllRoutines } from "@/lib/utils";
import { saveSession } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import type { Routine, RoutineStep } from "@/lib/types";
import { format } from "date-fns";
import BottomNav from "@/components/navigation/BottomNav";
import { useSpeech } from "@/hooks/useSpeech";

type TimerState = "idle" | "running" | "paused" | "done";

const BREATH_CUES: Record<string, string[]> = {
  inhale: ["Inspira lentamente", "Prendi un respiro profondo", "Inspira"],
  hold:   ["Trattieni", "Tieni il respiro dolcemente"],
  exhale: ["Esala lentamente", "Lascia andare", "Esala con calma"],
  rest:   [""],
};

function TimerContent() {
  const searchParams = useSearchParams();
  const { speak, speakBreath, stop, isSupported } = useSpeech();

  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepElapsed, setStepElapsed] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastSpokenStep, setLastSpokenStep] = useState(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const param = searchParams.get("routine");
    if (param) { const r = getRoutineById(param); if (r) setSelectedRoutine(r); }
  }, [searchParams]);

  const currentStep = selectedRoutine?.steps[currentStepIdx] ?? null;
  const totalDuration = selectedRoutine?.duration ?? 0;
  const progressPct = totalDuration > 0 ? Math.min(elapsed / totalDuration, 1) : 0;
  const stepProgress = currentStep ? Math.min(stepElapsed / currentStep.duration, 1) : 0;

  // Leggi istruzione quando cambia step
  useEffect(() => {
    if (!voiceEnabled || !isSupported || timerState !== "running" || !currentStep) return;
    if (currentStepIdx === lastSpokenStep) return;
    setLastSpokenStep(currentStepIdx);
    const t = setTimeout(() => {
      speak(`${currentStep.name}. ${currentStep.instruction}`, { rate: 0.82, pitch: 0.95 });
    }, 700);
    return () => clearTimeout(t);
  }, [currentStepIdx, timerState, voiceEnabled, isSupported, currentStep, lastSpokenStep, speak]);

  // Cue di respiro ogni 10 secondi
  useEffect(() => {
    if (!voiceEnabled || !isSupported || timerState !== "running") return;
    if (!currentStep?.breathPhase || stepElapsed % 10 !== 0 || stepElapsed === 0) return;
    const cues = BREATH_CUES[currentStep.breathPhase] ?? [];
    const cue = cues[Math.floor(Math.random() * cues.length)];
    if (cue) speakBreath(cue);
  }, [stepElapsed, currentStep, timerState, voiceEnabled, isSupported, speak]);

  const tick = useCallback(() => {
    setElapsed(e => e + 1);
    setStepElapsed(se => se + 1);
  }, []);

  // Avanza step o completa
  useEffect(() => {
    if (!selectedRoutine || timerState !== "running" || !currentStep) return;
    if (stepElapsed < currentStep.duration) return;
    const nextIdx = currentStepIdx + 1;
    if (nextIdx < selectedRoutine.steps.length) {
      setCurrentStepIdx(nextIdx);
      setStepElapsed(0);
    } else {
      clearInterval(intervalRef.current!);
      setTimerState("done");
      if (voiceEnabled && isSupported) {
        setTimeout(() => speak("Pratica completata. Ottimo lavoro. Prenditi un momento, per sentirti.", { rate: 0.72 }), 500);
      }
      saveSession({ id: generateId(), date: format(new Date(), "yyyy-MM-dd"), routineId: selectedRoutine.id, routineType: selectedRoutine.type, duration: elapsed + 1, targetDuration: selectedRoutine.duration, completed: true, createdAt: new Date().toISOString() });
    }
  }, [stepElapsed, currentStepIdx, selectedRoutine, timerState, elapsed, voiceEnabled, isSupported, speak, currentStep]);

  function start() {
    if (!selectedRoutine) return;
    setTimerState("running"); setElapsed(0); setStepElapsed(0); setCurrentStepIdx(0); setLastSpokenStep(-1);
    intervalRef.current = setInterval(tick, 1000);
    if (voiceEnabled && isSupported) {
      setTimeout(() => speak(`Benvenuto. Inizia ${selectedRoutine.name}. ${selectedRoutine.steps[0]?.name ?? ""}. ${selectedRoutine.steps[0]?.instruction ?? ""}`, { rate: 0.82 }), 800);
    }
  }

  function pause() {
    clearInterval(intervalRef.current!); setTimerState("paused"); stop();
    if (voiceEnabled && isSupported) setTimeout(() => speak("Prenditi una pausa.", { rate: 0.75 }), 200);
  }

  function resume() {
    setTimerState("running");
    intervalRef.current = setInterval(tick, 1000);
    if (voiceEnabled && isSupported) setTimeout(() => speak("Riprendiamo, con calma.", { rate: 0.75 }), 300);
  }

  function stopTimer() {
    clearInterval(intervalRef.current!); stop();
    if (elapsed > 30) saveSession({ id: generateId(), date: format(new Date(), "yyyy-MM-dd"), routineId: selectedRoutine?.id ?? "", routineType: selectedRoutine?.type ?? "centratura", duration: elapsed, targetDuration: selectedRoutine?.duration ?? 0, completed: false, createdAt: new Date().toISOString() });
    setTimerState("idle"); setElapsed(0); setStepElapsed(0); setCurrentStepIdx(0); setLastSpokenStep(-1);
  }

  function toggleVoice() { setVoiceEnabled(v => !v); if (voiceEnabled) stop(); }

  useEffect(() => () => { clearInterval(intervalRef.current!); stop(); }, [stop]);

  const RADIUS = 90;
  const CIRCUM = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUM * (1 - progressPct);

  if (timerState === "done") return (
    <CompletionScreen routine={selectedRoutine!} duration={elapsed}
      onReset={() => { setTimerState("idle"); setElapsed(0); setLastSpokenStep(-1); }} />
  );

  return (
    <div className="page-container flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full bg-pratica-warm text-pratica-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>
        <h1 className="font-display text-lg text-pratica-text">{selectedRoutine?.name ?? "Timer"}</h1>
        {isSupported && (selectedRoutine || timerState !== "idle")
          ? <button onClick={toggleVoice} title={voiceEnabled ? "Voce attiva" : "Voce off"}
              className={cn("w-8 h-8 flex items-center justify-center rounded-full transition-all text-base",
                voiceEnabled ? "bg-pratica-green-light" : "bg-pratica-warm")}>
              {voiceEnabled ? "🔊" : "🔇"}
            </button>
          : <div className="w-8" />}
      </div>

      {timerState === "idle" && !selectedRoutine && <RoutineSelector routines={getAllRoutines()} onSelect={setSelectedRoutine} />}

      {selectedRoutine && timerState === "idle" && (
        <RoutinePreview routine={selectedRoutine} voiceEnabled={voiceEnabled} isSupported={isSupported}
          onToggleVoice={toggleVoice} onStart={start} />
      )}

      {(timerState === "running" || timerState === "paused") && selectedRoutine && (
        <ActiveTimer routine={selectedRoutine} elapsed={elapsed} stepElapsed={stepElapsed}
          currentStep={currentStep} progressPct={progressPct} CIRCUM={CIRCUM} dashOffset={dashOffset}
          RADIUS={RADIUS} stepProgress={stepProgress} isRunning={timerState === "running"}
          voiceEnabled={voiceEnabled} isSupported={isSupported}
          onPause={pause} onResume={resume} onStop={stopTimer} onToggleVoice={toggleVoice} />
      )}

      {timerState === "idle" && <BottomNav />}
    </div>
  );
}

function RoutineSelector({ routines, onSelect }: { routines: Routine[]; onSelect: (r: Routine) => void }) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24">
      <p className="text-pratica-muted text-sm mb-4">Scegli una pratica</p>
      <div className="space-y-3">
        {routines.map((r, i) => (
          <button key={r.id} onClick={() => onSelect(r)}
            className={`pratica-card w-full p-4 flex items-center gap-4 text-left animate-fade-up stagger-${Math.min(i+1,6)}`}
            style={{ opacity:0, animationFillMode:"forwards" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background:`${r.color}22` }}>{r.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-pratica-text">{r.name}</p>
              <p className="text-xs text-pratica-muted mt-0.5 truncate">{r.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-pratica-muted">{formatDuration(r.duration)}</p>
              <p className="text-xs text-pratica-muted capitalize mt-0.5">{r.intensity}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RoutinePreview({ routine, voiceEnabled, isSupported, onToggleVoice, onStart }:
  { routine: Routine; voiceEnabled: boolean; isSupported: boolean; onToggleVoice: () => void; onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col px-4 pb-8 animate-fade-up overflow-y-auto no-scrollbar">
      <div className="rounded-3xl p-6 mb-5 relative overflow-hidden" style={{ background:`${routine.color}18`, border:`1px solid ${routine.color}44` }}>
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20" style={{ background:routine.color }} />
        <div className="text-5xl mb-3">{routine.icon}</div>
        <h2 className="font-display text-2xl text-pratica-text mb-1">{routine.name}</h2>
        <p className="text-sm text-pratica-muted font-light leading-relaxed">{routine.description}</p>
        <div className="flex gap-4 mt-4">
          <div><p className="text-xs text-pratica-muted">Durata</p><p className="text-sm font-medium">{formatDuration(routine.duration)}</p></div>
          <div><p className="text-xs text-pratica-muted">Intensità</p><p className="text-sm font-medium capitalize">{routine.intensity}</p></div>
          <div><p className="text-xs text-pratica-muted">Step</p><p className="text-sm font-medium">{routine.steps.length}</p></div>
        </div>
      </div>

      {/* Voice toggle */}
      {isSupported && (
        <button onClick={onToggleVoice}
          className={cn("w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-4 transition-all",
            voiceEnabled ? "bg-pratica-green-light" : "bg-pratica-warm")}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{voiceEnabled ? "🔊" : "🔇"}</span>
            <div className="text-left">
              <p className="text-sm font-medium text-pratica-text">{voiceEnabled ? "Guida vocale attiva" : "Guida vocale disattiva"}</p>
              <p className="text-xs text-pratica-muted">{voiceEnabled ? "Legge istruzioni e cue di respiro" : "Tocca per attivare"}</p>
            </div>
          </div>
          <div className={cn("w-11 h-6 rounded-full transition-all flex items-center px-0.5", voiceEnabled ? "bg-pratica-green" : "bg-pratica-border")}>
            <div className={cn("w-5 h-5 rounded-full bg-white shadow transition-all", voiceEnabled ? "translate-x-5" : "translate-x-0")} />
          </div>
        </button>
      )}

      <div className="mb-5">
        <p className="text-xs text-pratica-muted uppercase tracking-widest mb-3">Sequenza</p>
        <div className="space-y-2">
          {routine.steps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-pratica-warm flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-pratica-muted">{i+1}</span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-pratica-text font-medium">{step.name}</span>
                  <span className="text-xs text-pratica-muted">{formatDuration(step.duration)}</span>
                  {step.breathPhase && voiceEnabled && isSupported && <span className="text-[10px] text-pratica-green-dark bg-pratica-green-light px-1.5 py-0.5 rounded-full">🎙 voce</span>}
                </div>
                <p className="text-xs text-pratica-muted font-light leading-relaxed mt-0.5">{step.instruction}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <button onClick={onStart}
          className="w-full py-4 rounded-2xl font-medium text-base text-white transition-all active:scale-98"
          style={{ background:`linear-gradient(135deg,${routine.color} 0%,${routine.color}cc 100%)` }}>
          {voiceEnabled && isSupported ? "🔊 Inizia con guida vocale" : "Inizia ora"}
        </button>
        <Link href="/timer" className="block text-center text-sm text-pratica-muted py-2">Scegli altra pratica</Link>
      </div>
    </div>
  );
}

function ActiveTimer({ routine, elapsed, stepElapsed, currentStep, progressPct, CIRCUM, dashOffset, RADIUS, stepProgress, isRunning, voiceEnabled, isSupported, onPause, onResume, onStop, onToggleVoice }:
{ routine: Routine; elapsed: number; stepElapsed: number; currentStep: RoutineStep | null; progressPct: number; CIRCUM: number; dashOffset: number; RADIUS: number; stepProgress: number; isRunning: boolean; voiceEnabled: boolean; isSupported: boolean; onPause: ()=>void; onResume: ()=>void; onStop: ()=>void; onToggleVoice: ()=>void; }) {
  const bp = currentStep?.breathPhase;
  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 pb-8">
      <div className="relative flex items-center justify-center mt-6">
        {bp && isRunning && <>
          <div className="absolute rounded-full opacity-20" style={{ width:RADIUS*2+60, height:RADIUS*2+60, background:routine.color, animation:`${bp==="inhale"?"breatheExpand":"breatheContract"} ${bp==="exhale"?"6s":"4s"} ease-in-out infinite` }}/>
          <div className="absolute rounded-full opacity-10" style={{ width:RADIUS*2+30, height:RADIUS*2+30, background:routine.color, animation:`${bp==="inhale"?"breatheExpand":"breatheContract"} ${bp==="exhale"?"6s":"4s"} ease-in-out 0.5s infinite` }}/>
        </>}
        <svg width={RADIUS*2+24} height={RADIUS*2+24} viewBox={`0 0 ${RADIUS*2+24} ${RADIUS*2+24}`}>
          <circle cx={RADIUS+12} cy={RADIUS+12} r={RADIUS} fill="none" stroke="#E0D8CC" strokeWidth={3}/>
          <circle cx={RADIUS+12} cy={RADIUS+12} r={RADIUS} fill="none" stroke={routine.color} strokeWidth={3} strokeLinecap="round" strokeDasharray={CIRCUM} strokeDashoffset={dashOffset}
            style={{ transform:`rotate(-90deg)`, transformOrigin:`${RADIUS+12}px ${RADIUS+12}px`, transition:"stroke-dashoffset 1s linear" }}/>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-display text-5xl text-pratica-text">{formatDuration(elapsed)}</span>
          {currentStep && <span className="text-sm text-pratica-muted mt-1 text-center max-w-[120px] leading-tight">{currentStep.name}</span>}
          {bp === "inhale" && isRunning && <span className="text-xs text-pratica-green-dark mt-1 animate-pulse">Inspira ↑</span>}
          {bp === "exhale" && isRunning && <span className="text-xs text-pratica-blue mt-1 animate-pulse">Esala ↓</span>}
        </div>
      </div>

      {currentStep && (
        <div className="w-full pratica-card p-5 my-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-pratica-muted uppercase tracking-widest">{currentStep.name}</p>
            <div className="flex items-center gap-2">
              {currentStep.breathPhase && voiceEnabled && isSupported && <span className="text-xs text-pratica-green-dark">🎙</span>}
              <p className="text-xs text-pratica-muted">{formatDuration(currentStep.duration - stepElapsed)}</p>
            </div>
          </div>
          <p className="text-sm text-pratica-text font-light leading-relaxed">{currentStep.instruction}</p>
          <div className="mt-3 h-1 bg-pratica-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width:`${stepProgress*100}%`, background:routine.color }}/>
          </div>
        </div>
      )}

      <div className="flex items-center gap-5">
        <button onClick={onStop} className="w-12 h-12 rounded-full bg-pratica-warm flex items-center justify-center text-pratica-muted">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        </button>
        <button onClick={isRunning ? onPause : onResume}
          className="flex items-center justify-center text-white shadow-green active:scale-95 transition-transform"
          style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${routine.color} 0%,${routine.color}bb 100%)` }}>
          {isRunning
            ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>}
        </button>
        {isSupported
          ? <button onClick={onToggleVoice}
              className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all",
                voiceEnabled ? "bg-pratica-green-light" : "bg-pratica-warm")}>
              {voiceEnabled ? "🔊" : "🔇"}
            </button>
          : <div className="w-12 h-12" />}
      </div>
    </div>
  );
}

function CompletionScreen({ routine, duration, onReset }: { routine: Routine; duration: number; onReset: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16 text-center animate-scale-in">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-float" style={{ background:`${routine.color}22` }}>
        <span className="text-5xl">{routine.icon}</span>
      </div>
      <h2 className="font-display text-3xl text-pratica-text mb-2">Ottimo lavoro</h2>
      <p className="text-pratica-muted font-light mb-1">{routine.name} completata</p>
      <p className="text-sm text-pratica-muted mb-8">{formatDuration(duration)} di pratica</p>
      <div className="w-full space-y-3">
        <Link href="/diary" className="block w-full py-4 rounded-2xl text-white font-medium text-center"
          style={{ background:`linear-gradient(135deg,${routine.color} 0%,${routine.color}bb 100%)` }}>
          Registra umore
        </Link>
        <button onClick={onReset} className="w-full py-3 rounded-2xl text-pratica-muted text-sm">Nuova sessione</button>
        <Link href="/" className="block text-center text-sm text-pratica-muted py-2">Torna alla home</Link>
      </div>
    </div>
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-pratica-bg flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-pratica-green-light animate-pulse"/></div>}>
      <TimerContent />
    </Suspense>
  );
}
