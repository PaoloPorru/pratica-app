"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import type { GoalType, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

const GOALS: { id: GoalType; label: string; icon: string }[] = [
  { id: "consapevolezza", label: "Consapevolezza", icon: "🧘" },
  { id: "disciplina", label: "Disciplina", icon: "🎯" },
  { id: "focus", label: "Focus", icon: "🔍" },
  { id: "gestire_stress", label: "Gestire lo stress", icon: "🌊" },
  { id: "energia", label: "Più energia", icon: "⚡" },
  { id: "sonno_migliore", label: "Dormire meglio", icon: "🌙" },
];

const STRESS_LABELS = ["Minimo", "Basso", "Moderato", "Alto", "Molto alto"];

interface FormData {
  name: string;
  wakeTime: string;
  sleepTime: string;
  workHoursPerDay: number;
  stressLevel: number;
  goals: GoalType[];
}

const STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    name: "",
    wakeTime: "07:00",
    sleepTime: "22:30",
    workHoursPerDay: 8,
    stressLevel: 3,
    goals: [],
  });
  const [saving, setSaving] = useState(false);

  const progress = ((step + 1) / STEPS) * 100;

  function next() {
    if (step < STEPS - 1) setStep((s) => s + 1);
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  function toggleGoal(g: GoalType) {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(g)
        ? f.goals.filter((x) => x !== g)
        : [...f.goals, g].slice(0, 3),
    }));
  }

  async function finish() {
    setSaving(true);
    const profile: UserProfile = {
      ...form,
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
    await new Promise((r) => setTimeout(r, 600));
    router.replace("/");
  }

  const canNext = [
    form.name.trim().length >= 2,
    true,
    true,
    form.stressLevel > 0,
    form.goals.length >= 1,
  ][step];

  return (
    <div className="min-h-dvh bg-pratica-bg flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-pratica-border z-10">
        <div
          className="h-full bg-pratica-green transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6 pt-12">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 animate-fade-in">
          <span className="text-xs text-pratica-muted">{step + 1} di {STEPS}</span>
          {step > 0 && (
            <button
              onClick={back}
              className="ml-auto text-xs text-pratica-muted underline"
            >
              Indietro
            </button>
          )}
        </div>

        {/* Steps */}
        <div className="flex-1">
          {step === 0 && (
            <StepName value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          )}
          {step === 1 && (
            <StepSchedule
              wake={form.wakeTime}
              sleep={form.sleepTime}
              onWake={(v) => setForm((f) => ({ ...f, wakeTime: v }))}
              onSleep={(v) => setForm((f) => ({ ...f, sleepTime: v }))}
            />
          )}
          {step === 2 && (
            <StepWork
              hours={form.workHoursPerDay}
              onChange={(v) => setForm((f) => ({ ...f, workHoursPerDay: v }))}
            />
          )}
          {step === 3 && (
            <StepStress
              level={form.stressLevel}
              onChange={(v) => setForm((f) => ({ ...f, stressLevel: v }))}
            />
          )}
          {step === 4 && (
            <StepGoals
              selected={form.goals}
              onToggle={toggleGoal}
            />
          )}
        </div>

        {/* CTA */}
        <div className="pb-10 pt-6">
          {step < STEPS - 1 ? (
            <button
              onClick={next}
              disabled={!canNext}
              className={cn(
                "w-full py-4 rounded-2xl font-medium text-base transition-all duration-200",
                canNext
                  ? "bg-pratica-green text-white shadow-green active:scale-98"
                  : "bg-pratica-border text-pratica-muted"
              )}
            >
              Continua
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={!canNext || saving}
              className={cn(
                "w-full py-4 rounded-2xl font-medium text-base transition-all duration-200",
                canNext && !saving
                  ? "bg-pratica-green text-white shadow-green"
                  : "bg-pratica-border text-pratica-muted"
              )}
            >
              {saving ? "..." : "Inizia la pratica ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step components ─────────────────────────────────────────────────────────

function StepName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="animate-slide-up">
      <p className="text-pratica-muted text-sm mb-2">Prima di tutto</p>
      <h2 className="font-display text-3xl text-pratica-text mb-8 leading-tight">
        Come ti chiami?
      </h2>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Il tuo nome"
        autoFocus
        className="w-full bg-transparent border-b-2 border-pratica-border focus:border-pratica-green outline-none text-2xl font-display text-pratica-text py-2 transition-colors placeholder:text-pratica-border"
      />
      <p className="text-xs text-pratica-muted mt-4 font-light">
        Tutto rimane sul tuo dispositivo. Nessun dato inviato.
      </p>
    </div>
  );
}

function StepSchedule({
  wake, sleep, onWake, onSleep
}: { wake: string; sleep: string; onWake: (v: string) => void; onSleep: (v: string) => void }) {
  return (
    <div className="animate-slide-up">
      <p className="text-pratica-muted text-sm mb-2">Il tuo ritmo</p>
      <h2 className="font-display text-3xl text-pratica-text mb-8 leading-tight">
        A che ora ti svegli<br />e vai a dormire?
      </h2>
      <div className="space-y-6">
        <div>
          <label className="text-sm text-pratica-muted mb-2 block">🌅 Mi sveglio alle</label>
          <input
            type="time"
            value={wake}
            onChange={(e) => onWake(e.target.value)}
            className="w-full bg-pratica-warm rounded-2xl px-4 py-4 text-2xl font-display text-pratica-text border border-pratica-border outline-none focus:border-pratica-green transition-colors"
          />
        </div>
        <div>
          <label className="text-sm text-pratica-muted mb-2 block">🌙 Vado a dormire alle</label>
          <input
            type="time"
            value={sleep}
            onChange={(e) => onSleep(e.target.value)}
            className="w-full bg-pratica-warm rounded-2xl px-4 py-4 text-2xl font-display text-pratica-text border border-pratica-border outline-none focus:border-pratica-green transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

function StepWork({ hours, onChange }: { hours: number; onChange: (v: number) => void }) {
  return (
    <div className="animate-slide-up">
      <p className="text-pratica-muted text-sm mb-2">La tua giornata</p>
      <h2 className="font-display text-3xl text-pratica-text mb-8 leading-tight">
        Quante ore lavori<br />al giorno?
      </h2>
      <div className="text-center mb-6">
        <span className="font-display text-7xl text-pratica-green-dark">{hours}</span>
        <span className="text-pratica-muted text-xl ml-2">ore</span>
      </div>
      <input
        type="range"
        min={1}
        max={14}
        value={hours}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-pratica-green h-2 rounded-full"
        style={{ accentColor: "#A8B8A0" }}
      />
      <div className="flex justify-between text-xs text-pratica-muted mt-2">
        <span>1 ora</span>
        <span>14 ore</span>
      </div>
      <p className="text-xs text-pratica-muted mt-4 font-light text-center">
        Useremo questo per calibrare le sessioni di focus
      </p>
    </div>
  );
}

function StepStress({ level, onChange }: { level: number; onChange: (v: number) => void }) {
  return (
    <div className="animate-slide-up">
      <p className="text-pratica-muted text-sm mb-2">Il tuo baseline</p>
      <h2 className="font-display text-3xl text-pratica-text mb-8 leading-tight">
        Come descriveresti<br />il tuo stress abituale?
      </h2>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              "py-4 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200",
              level === v
                ? "bg-pratica-green text-white scale-105 shadow-green"
                : "bg-pratica-warm text-pratica-muted"
            )}
          >
            <span className="text-lg">{"🌱🌿🍃🌊🌋"[v - 1]}</span>
            <span className="text-xs font-medium">{v}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-pratica-muted mt-4 font-light">
        {level ? STRESS_LABELS[level - 1] : "Seleziona"}
      </p>
    </div>
  );
}

function StepGoals({
  selected,
  onToggle,
}: { selected: GoalType[]; onToggle: (g: GoalType) => void }) {
  return (
    <div className="animate-slide-up">
      <p className="text-pratica-muted text-sm mb-2">Il tuo "perché"</p>
      <h2 className="font-display text-3xl text-pratica-text mb-2 leading-tight">
        Cosa vuoi coltivare?
      </h2>
      <p className="text-sm text-pratica-muted mb-6">Scegli fino a 3 obiettivi</p>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(({ id, label, icon }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              className={cn(
                "p-4 rounded-2xl text-left transition-all duration-200",
                active
                  ? "bg-pratica-green text-white shadow-green scale-[1.02]"
                  : "bg-pratica-warm text-pratica-text"
              )}
            >
              <span className="text-2xl block mb-2">{icon}</span>
              <span className="text-sm font-medium leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
