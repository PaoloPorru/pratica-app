"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getProfile, getStreak, getTodayDiaryEntry, getTodaySessions, getDiary } from "@/lib/storage";
import { getRecommendation, calculateEnergyLevel } from "@/lib/recommendationEngine";
import { getMoodEmoji, getRoutineById, formatDuration } from "@/lib/utils";
import type { CoachRecommendation } from "@/lib/types";

export default function WidgetPage() {
  const [ready, setReady] = useState(false);
  const [streak, setStreak] = useState(0);
  const [energy, setEnergy] = useState(3);
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [todayDone, setTodayDone] = useState(0);
  const [rec, setRec] = useState<CoachRecommendation | null>(null);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [time, setTime] = useState("");

  useEffect(() => {
    const profile = getProfile();
    if (!profile?.onboardingComplete) { setReady(true); return; }

    const diary = getDiary();
    const allSessions2 = JSON.parse(localStorage.getItem("pratica:sessions") || "[]");
    const streakData = getStreak();
    const todayEntry = getTodayDiaryEntry();
    const todaySessions = getTodaySessions();

    setStreak(streakData.currentStreak);
    setTotalMinutes(streakData.totalMinutes);
    setEnergy(calculateEnergyLevel(profile, diary));
    setTodayMood(todayEntry?.mood ?? null);
    setTodayDone(todaySessions.filter((s: { completed: boolean }) => s.completed).length);

    getRecommendation({ profile, sessions: allSessions2, diary }).then((r) => {
      setRec(r);
      setReady(true);
    });

    // Live clock
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const routine = rec ? getRoutineById(rec.routineType) : null;
  const profile = typeof window !== "undefined" ? getProfile() : null;

  const energyLabel = ["Esausto", "Stanco", "Ok", "Energico", "Al top"][energy - 1];
  const energyColor = ["#EF9999", "#F5C87A", "#F5E07A", "#A8B8A0", "#7A9970"][energy - 1];

  if (!ready) {
    return (
      <div className="min-h-dvh bg-pratica-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-pratica-green-light animate-pulse" />
      </div>
    );
  }

  if (!profile?.onboardingComplete) {
    return (
      <div className="min-h-dvh bg-pratica-bg flex flex-col items-center justify-center px-6 text-center gap-4">
        <span className="text-5xl">🌿</span>
        <p className="font-display text-2xl text-pratica-text">Benvenuto in Pratica</p>
        <p className="text-sm text-pratica-muted">Completa l&apos;onboarding per vedere il tuo widget</p>
        <Link href="/" className="bg-pratica-green text-white px-6 py-3 rounded-2xl text-sm font-medium">
          Inizia
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{
        background: "linear-gradient(160deg, #EEF2EB 0%, #F8F6F1 50%, #EBF0F4 100%)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-pratica-green flex items-center justify-center">
            <span className="text-xs">🌿</span>
          </div>
          <span className="text-xs font-medium text-pratica-muted tracking-wide">PRATICA</span>
        </div>
        <span className="font-display text-xl text-pratica-text">{time}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-2 flex flex-col gap-3">

        {/* Streak + Energia */}
        <div className="grid grid-cols-2 gap-3">
          {/* Streak */}
          <div
            className="rounded-3xl p-4 flex flex-col justify-between"
            style={{
              background: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(168,184,160,0.25)",
              boxShadow: "0 2px 16px rgba(44,44,44,0.06)",
            }}
          >
            <p className="text-[10px] text-pratica-muted uppercase tracking-widest">Streak</p>
            <div>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className="font-display leading-none"
                  style={{ fontSize: streak > 99 ? "2.8rem" : "3.5rem", color: "#7A9970" }}
                >
                  {streak}
                </span>
              </div>
              <p className="text-[11px] text-pratica-muted mt-0.5">
                {streak === 1 ? "giorno" : "giorni"} · {totalMinutes} min
              </p>
            </div>
          </div>

          {/* Energia */}
          <div
            className="rounded-3xl p-4 flex flex-col justify-between"
            style={{
              background: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(110,130,150,0.2)",
              boxShadow: "0 2px 16px rgba(44,44,44,0.06)",
            }}
          >
            <p className="text-[10px] text-pratica-muted uppercase tracking-widest">Energia</p>
            <div>
              {/* Mini bar chart */}
              <div className="flex items-end gap-1 h-8 mt-2 mb-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-all"
                    style={{
                      height: `${35 + i * 13}%`,
                      background: i < energy ? energyColor : "#E0D8CC",
                    }}
                  />
                ))}
              </div>
              <p className="text-[11px] text-pratica-muted">{energyLabel}</p>
            </div>
          </div>
        </div>

        {/* Oggi */}
        <div
          className="rounded-3xl px-4 py-3 flex items-center gap-3"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(224,216,204,0.5)",
            boxShadow: "0 2px 16px rgba(44,44,44,0.06)",
          }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: todayMood ? "#D4E0CF" : "#F0ECE4" }}
          >
            <span className="text-2xl">
              {todayMood ? getMoodEmoji(todayMood) : "🌅"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-pratica-text">
              Oggi
            </p>
            <p className="text-[11px] text-pratica-muted mt-0.5 truncate">
              {todayDone > 0
                ? `${todayDone} pratica${todayDone > 1 ? "e" : ""} ✓`
                : "Nessuna pratica ancora"}
              {todayMood ? ` · ${["😔", "😕", "😐", "🙂", "😊"][todayMood - 1]}` : ""}
            </p>
          </div>
          <Link
            href="/diary"
            className="text-[11px] text-pratica-blue flex-shrink-0 border border-pratica-blue-light rounded-full px-2.5 py-1"
          >
            {todayMood ? "Vedi" : "Log"}
          </Link>
        </div>

        {/* Coach suggestion */}
        {routine && rec && (
          <div
            className="rounded-3xl p-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${routine.color}22 0%, rgba(255,255,255,0.85) 70%)`,
              border: `1px solid ${routine.color}44`,
              boxShadow: "0 2px 16px rgba(44,44,44,0.06)",
            }}
          >
            <div
              className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-15"
              style={{ background: routine.color }}
            />
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[10px] text-pratica-muted uppercase tracking-widest">Per te ora</p>
                <p className="font-display text-lg text-pratica-text mt-0.5">{routine.name}</p>
              </div>
              <span className="text-3xl">{routine.icon}</span>
            </div>
            <p className="text-[11px] text-pratica-muted italic mb-3 leading-relaxed line-clamp-2">
              &ldquo;{rec.message}&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-pratica-muted">
                {formatDuration(rec.adjustedDuration)} · {routine.intensity}
              </span>
              <Link
                href={`/timer?routine=${rec.routineType}`}
                className="text-xs font-medium text-white px-4 py-2 rounded-xl active:scale-95 transition-transform"
                style={{ background: routine.color }}
              >
                Inizia →
              </Link>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: "/timer?routine=respirazione", icon: "🫁", label: "Respira" },
            { href: "/timer?routine=reset", icon: "🔄", label: "Reset" },
            { href: "/progress", icon: "📊", label: "Stats" },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              style={{
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(224,216,204,0.5)",
                boxShadow: "0 1px 8px rgba(44,44,44,0.04)",
              }}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] text-pratica-muted font-medium">{label}</span>
            </Link>
          ))}
        </div>

        {/* Footer link */}
        <div className="flex justify-center pt-1 pb-2">
          <Link
            href="/"
            className="text-[11px] text-pratica-muted flex items-center gap-1.5"
          >
            <span className="w-4 h-4 rounded bg-pratica-green-light flex items-center justify-center text-[9px]">🌿</span>
            Apri Pratica completa
          </Link>
        </div>
      </div>
    </div>
  );
}
