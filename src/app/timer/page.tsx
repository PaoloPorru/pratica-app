"use client";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getRoutineById, formatDuration, cn } from "@/lib/utils";
import { getAllRoutines } from "@/lib/utils";
import { saveSession } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import type { Routine, RoutineStep } from "@/lib/types";
import { format } from "date-fns";
import BottomNav from "@/components/navigation/BottomNav";

type TimerState = "idle" | "running" | "paused" | "done";

function TimerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routineParam = searchParams.get("routine");

  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepElapsed, setStepElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const allRoutines = getAllRoutines();

  useEffect(() => {
    if (routineParam) {
      const r = getRoutineById(routineParam);
      if (r) setSelectedRoutine(r);
    }
  }, [routineParam]);

  const currentStep = selectedRoutine?.steps[currentStepIdx] ?? null;
  const totalDuration = selectedRoutine?.duration ?? 0;
  const progressPct = totalDuration > 0 ? Math.min(elapsed / totalDuration, 1) : 0;

  const tick = useCallback(() => {
    setElapsed((e) => {
      const newElapsed = e + 1;
      setStepElapsed((se) => {
        const newSe = se + 1;
        return newSe;
      });
      return newElapsed;
    });
  }, []);

  // Advance step based on step elapsed
  useEffect(() => {
    if (!selectedRoutine || timerState !== "running") return;
    const step = selectedRoutine.steps[currentStepIdx];
    if (!step) return;
    if (stepElapsed >= step.duration) {
      const nextIdx = currentStepIdx + 1;
      if (nextIdx < selectedRoutine.steps.length) {
        setCurrentStepIdx(nextIdx);
        setStepElapsed(0);
      } else {
        // All steps done
        clearInterval(intervalRef.current!);
        setTimerState("done");
        handleComplete(elapsed + 1, true);
      }
    }
  }, [stepElapsed, currentStepIdx, selectedRoutine, timerState]);

  function handleComplete(duration: number, completed: boolean) {
    if (!selectedRoutine) return;
    const session = {
      id: generateId(),
      date: format(new Date(), "yyyy-MM-dd"),
      routineId: selectedRoutine.id,
      routineType: selectedRoutine.type,
      duration,
      targetDuration: selectedRoutine.duration,
      completed,
      createdAt: new Date().toISOString(),
    };
    saveSession(session);
  }

  function start() {
    if (!selectedRoutine) return;
    setTimerState("running");
    setElapsed(0);
    setStepElapsed(0);
    setCurrentStepIdx(0);
    intervalRef.current = setInterval(tick, 1000);
  }

  function pause() {
    clearInterval(intervalRef.current!);
    setTimerState("paused");
  }

  function resume() {
    setTimerState("running");
    intervalRef.current = setInterval(tick, 1000);
  }

  function stop() {
    clearInterval(intervalRef.current!);
    if (elapsed > 30) handleComplete(elapsed, false);
    setTimerState("idle");
    setElapsed(0);
    setStepElapsed(0);
    setCurrentStepIdx(0);
  }

  useEffect(() => {
    return () => clearInterval(intervalRef.current!);
  }, []);

  // Breathing phase
  const breathPhase = currentStep?.breathPhase;
  const isBreathing = breathPhase === "inhale" || breathPhase === "exhale";

  // SVG progress ring
  const RADIUS = 90;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressPct);

  if (timerState === "done") {
    return <CompletionScreen routine={selectedRoutine!} duration={elapsed} onReset={() => { setTimerState("idle"); setElapsed(0); }} />;
  }

  return (
    <div className="page-container flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full bg-pratica-warm text-pratica-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <h1 className="font-display text-lg text-pratica-text">
          {selectedRoutine ? selectedRoutine.name : "Timer"}
        </h1>
        <div className="w-8" />
      </div>

      {timerState === "idle" && !selectedRoutine && (
        <RoutineSelector routines={allRoutines} onSelect={setSelectedRoutine} />
      )}

      {selectedRoutine && timerState === "idle" && (
        <RoutinePreview routine={selectedRoutine} onStart={start} />
      )}

      {(timerState === "running" || timerState === "paused") && selectedRoutine && (
        <ActiveTimer
          routine={selectedRoutine}
          elapsed={elapsed}
          stepElapsed={stepElapsed}
          currentStep={currentStep}
          progressPct={progressPct}
          circumference={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          RADIUS={RADIUS}
          isRunning={timerState === "running"}
          breathPhase={breathPhase}
          onPause={pause}
          onResume={resume}
          onStop={stop}
        />
      )}

      {(timerState === "idle" || !selectedRoutine) && <BottomNav />}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RoutineSelector({ routines, onSelect }: { routines: Routine[]; onSelect: (r: Routine) => void }) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24">
      <p className="text-pratica-muted text-sm mb-4">Scegli una pratica</p>
      <div className="space-y-3">
        {routines.map((r, i) => (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className={`pratica-card w-full p-4 flex items-center gap-4 text-left animate-fade-up stagger-${Math.min(i + 1, 6)}`}
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${r.color}22` }}
            >
              {r.icon}
            </div>
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

function RoutinePreview({ routine, onStart }: { routine: Routine; onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col px-4 pb-8 animate-fade-up">
      <div
        className="rounded-3xl p-6 mb-6 relative overflow-hidden"
        style={{ background: `${routine.color}18`, border: `1px solid ${routine.color}44` }}
      >
        <div
          className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20"
          style={{ background: routine.color }}
        />
        <div className="text-5xl mb-3">{routine.icon}</div>
        <h2 className="font-display text-2xl text-pratica-text mb-1">{routine.name}</h2>
        <p className="text-sm text-pratica-muted font-light leading-relaxed">{routine.description}</p>
        <div className="flex gap-4 mt-4">
          <div>
            <p className="text-xs text-pratica-muted">Durata</p>
            <p className="text-sm font-medium text-pratica-text">{formatDuration(routine.duration)}</p>
          </div>
          <div>
            <p className="text-xs text-pratica-muted">Intensità</p>
            <p className="text-sm font-medium text-pratica-text capitalize">{routine.intensity}</p>
          </div>
          <div>
            <p className="text-xs text-pratica-muted">Step</p>
            <p className="text-sm font-medium text-pratica-text">{routine.steps.length}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-pratica-muted uppercase tracking-widest mb-3">Sequenza</p>
        <div className="space-y-2">
          {routine.steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-pratica-warm flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-pratica-muted">{i + 1}</span>
              </div>
              <div>
                <span className="text-sm text-pratica-text">{step.name}</span>
                <span className="text-xs text-pratica-muted ml-2">{formatDuration(step.duration)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl font-medium text-base text-white transition-all active:scale-98"
          style={{ background: `linear-gradient(135deg, ${routine.color} 0%, ${routine.color}cc 100%)` }}
        >
          Inizia ora
        </button>
        <Link
          href="/timer"
          className="block text-center text-sm text-pratica-muted py-2"
        >
          Scegli altra pratica
        </Link>
      </div>
    </div>
  );
}

function ActiveTimer({
  routine, elapsed, stepElapsed, currentStep, progressPct,
  circumference, strokeDashoffset, RADIUS, isRunning, breathPhase,
  onPause, onResume, onStop
}: {
  routine: Routine; elapsed: number; stepElapsed: number;
  currentStep: RoutineStep | null; progressPct: number;
  circumference: number; strokeDashoffset: number; RADIUS: number;
  isRunning: boolean; breathPhase?: string;
  onPause: () => void; onResume: () => void; onStop: () => void;
}) {
  const stepProgress = currentStep
    ? Math.min(stepElapsed / currentStep.duration, 1)
    : 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 pb-8">
      {/* Circular timer */}
      <div className="relative flex items-center justify-center mt-8">
        {/* Breathing rings */}
        {breathPhase && isRunning && (
          <>
            <div
              className="absolute rounded-full opacity-20"
              style={{
                width: RADIUS * 2 + 60,
                height: RADIUS * 2 + 60,
                background: routine.color,
                animation: breathPhase === "inhale"
                  ? "breatheExpand 4s ease-in-out infinite"
                  : "breatheContract 6s ease-in-out infinite",
              }}
            />
            <div
              className="absolute rounded-full opacity-10"
              style={{
                width: RADIUS * 2 + 30,
                height: RADIUS * 2 + 30,
                background: routine.color,
                animation: breathPhase === "inhale"
                  ? "breatheExpand 4s ease-in-out 0.5s infinite"
                  : "breatheContract 6s ease-in-out 0.5s infinite",
              }}
            />
          </>
        )}

        {/* SVG ring */}
        <svg
          width={RADIUS * 2 + 24}
          height={RADIUS * 2 + 24}
          viewBox={`0 0 ${RADIUS * 2 + 24} ${RADIUS * 2 + 24}`}
        >
          <circle
            cx={RADIUS + 12}
            cy={RADIUS + 12}
            r={RADIUS}
            fill="none"
            stroke="#E0D8CC"
            strokeWidth={3}
          />
          <circle
            cx={RADIUS + 12}
            cy={RADIUS + 12}
            r={RADIUS}
            fill="none"
            stroke={routine.color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: `${RADIUS + 12}px ${RADIUS + 12}px`,
              transition: "stroke-dashoffset 1s linear",
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-display text-5xl text-pratica-text">
            {formatDuration(elapsed)}
          </span>
          {currentStep && (
            <span className="text-sm text-pratica-muted mt-1 text-center max-w-[120px] leading-tight">
              {currentStep.name}
            </span>
          )}
          {breathPhase === "inhale" && isRunning && (
            <span className="text-xs text-pratica-green-dark mt-1 animate-pulse">Inspira ↑</span>
          )}
          {breathPhase === "exhale" && isRunning && (
            <span className="text-xs text-pratica-blue mt-1 animate-pulse">Esala ↓</span>
          )}
        </div>
      </div>

      {/* Current step */}
      {currentStep && (
        <div className="w-full pratica-card p-5 mx-0 my-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-pratica-muted uppercase tracking-widest">{currentStep.name}</p>
            <p className="text-xs text-pratica-muted">
              {formatDuration(currentStep.duration - stepElapsed)}
            </p>
          </div>
          <p className="text-sm text-pratica-text font-light leading-relaxed">
            {currentStep.instruction}
          </p>
          {/* Step progress bar */}
          <div className="mt-3 h-1 bg-pratica-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${stepProgress * 100}%`,
                background: routine.color,
              }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-6 mt-2">
        <button
          onClick={onStop}
          className="w-12 h-12 rounded-full bg-pratica-warm flex items-center justify-center text-pratica-muted"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
        </button>

        <button
          onClick={isRunning ? onPause : onResume}
          className="w-18 h-18 rounded-full flex items-center justify-center text-white shadow-green active:scale-95 transition-transform"
          style={{ width: 72, height: 72, background: `linear-gradient(135deg, ${routine.color} 0%, ${routine.color}bb 100%)` }}
        >
          {isRunning ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </button>

        <div className="w-12 h-12" /> {/* spacer */}
      </div>
    </div>
  );
}

function CompletionScreen({ routine, duration, onReset }: { routine: Routine; duration: number; onReset: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16 text-center animate-scale-in">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-float"
        style={{ background: `${routine.color}22` }}
      >
        <span className="text-5xl">{routine.icon}</span>
      </div>
      <h2 className="font-display text-3xl text-pratica-text mb-2">
        Ottimo lavoro
      </h2>
      <p className="text-pratica-muted font-light mb-1">
        {routine.name} completata
      </p>
      <p className="text-sm text-pratica-muted mb-8">
        {formatDuration(duration)} di pratica
      </p>
      <div className="w-full space-y-3">
        <Link
          href="/diary"
          className="block w-full py-4 rounded-2xl text-white font-medium text-center transition-all active:scale-98"
          style={{ background: `linear-gradient(135deg, ${routine.color} 0%, ${routine.color}bb 100%)` }}
        >
          Registra umore
        </Link>
        <button
          onClick={onReset}
          className="w-full py-3 rounded-2xl text-pratica-muted text-sm"
        >
          Nuova sessione
        </button>
        <Link
          href="/"
          className="block text-center text-sm text-pratica-muted py-2"
        >
          Torna alla home
        </Link>
      </div>
    </div>
  );
}

export default function TimerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-pratica-bg flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-pratica-green-light animate-pulse" />
      </div>
    }>
      <TimerContent />
    </Suspense>
  );
}
