"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/navigation/BottomNav";
import {
  getProfile,
  getStreak,
  getTodayDiaryEntry,
  getTodaySessions,
  getDiary,
  getSessions,
} from "@/lib/storage";
import {
  getRecommendation,
  calculateEnergyLevel,
  generateWeeklyInsight,
} from "@/lib/recommendationEngine";
import {
  getGreeting,
  getMoodEmoji,
  formatDuration,
  getRoutineById,
} from "@/lib/utils";
import type { CoachRecommendation } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [energy, setEnergy] = useState(3);
  const [streak, setStreak] = useState({ currentStreak: 0, totalSessions: 0, totalMinutes: 0 });
  const [recommendation, setRecommendation] = useState<CoachRecommendation | null>(null);
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [todayDone, setTodayDone] = useState(0);
  const [insight, setInsight] = useState<{ title: string; body: string } | null>(null);
  const [profileName, setProfileName] = useState("amico");

  useEffect(() => {
    const profile = getProfile();
    if (!profile?.onboardingComplete) {
      router.replace("/onboarding");
      return;
    }

    const diary = getDiary();
    const sessions = getSessions();
    const streakData = getStreak();
    const todayEntry = getTodayDiaryEntry();
    const todaySessions = getTodaySessions();

    setGreeting(getGreeting());
    setEnergy(calculateEnergyLevel(profile, diary));
    setStreak(streakData);
    setTodayMood(todayEntry?.mood ?? null);
    setTodayDone(todaySessions.filter((s) => s.completed).length);
    setProfileName(profile.name?.split(" ")[0] || "amico");

    const insightData = generateWeeklyInsight(sessions, diary, streakData.currentStreak);
    setInsight(insightData);

    getRecommendation({ profile, sessions, diary }).then((rec) => {
      setRecommendation(rec);
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-dvh bg-pratica-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-pratica-green-light flex items-center justify-center animate-pulse-slow">
            <span className="text-2xl">🌿</span>
          </div>
          <p className="text-pratica-muted font-body text-sm">Caricamento...</p>
        </div>
      </div>
    );
  }

  const routine = recommendation ? getRoutineById(recommendation.routineType) : null;
  const energyBars = Array.from({ length: 5 }, (_, i) => i < energy);
  const energyColors = ["bg-red-300","bg-orange-300","bg-yellow-300","bg-pratica-green","bg-pratica-green-dark"];

  return (
    <div className="page-container px-4 py-6 overflow-y-auto no-scrollbar">
      <header className="mb-6 animate-fade-up">
        <p className="text-pratica-muted text-sm font-body font-light">{greeting},</p>
        <h1 className="font-display text-3xl text-pratica-text mt-0.5">{profileName}</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-up stagger-1">
        <div className="pratica-card p-4">
          <p className="text-xs text-pratica-muted font-body uppercase tracking-widest mb-2">Energia</p>
          <div className="flex items-end gap-1 h-6 mb-1">
            {energyBars.map((filled, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-300 ${filled ? energyColors[i] : "bg-pratica-border"}`}
                style={{ height: `${40 + i * 12}%` }}
              />
            ))}
          </div>
          <p className="text-xs text-pratica-muted mt-1">
            {["Esausto","Stanco","Ok","Energico","Al top"][energy - 1]}
          </p>
        </div>

        <div className="pratica-card p-4 flex flex-col justify-between">
          <p className="text-xs text-pratica-muted font-body uppercase tracking-widest">Streak</p>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl text-pratica-green-dark">{streak.currentStreak}</span>
              <span className="text-pratica-muted text-sm">{streak.currentStreak === 1 ? "giorno" : "giorni"}</span>
            </div>
            <p className="text-xs text-pratica-muted mt-0.5">{streak.totalMinutes} min totali</p>
          </div>
        </div>
      </div>

      <div className="pratica-card p-4 mb-4 animate-fade-up stagger-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pratica-green-light flex items-center justify-center">
              {todayMood ? <span className="text-xl">{getMoodEmoji(todayMood)}</span> : <span className="text-xl">🌅</span>}
            </div>
            <div>
              <p className="text-sm font-medium text-pratica-text">Oggi</p>
              <p className="text-xs text-pratica-muted">
                {todayDone > 0 ? `${todayDone} sessione${todayDone > 1 ? "i" : ""} completata` : "Nessuna pratica ancora"}
                {todayMood ? ` · ${["😔","😕","😐","🙂","😊"][todayMood-1]}` : ""}
              </p>
            </div>
          </div>
          <Link href="/diary" className="text-xs text-pratica-blue border border-pratica-blue-light rounded-full px-3 py-1">
            {todayMood ? "Modifica" : "Registra"}
          </Link>
        </div>
      </div>

      {recommendation && routine && (
        <div
          className="pratica-card p-5 mb-4 animate-fade-up stagger-3 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(168,184,160,0.15) 0%, rgba(255,255,255,0.9) 60%)" }}
        >
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10" style={{ background: routine.color, transform: "translate(30%, -30%)" }} />
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-pratica-muted uppercase tracking-widest mb-1">Consigliato ora</p>
              <h2 className="font-display text-xl text-pratica-text">{routine.name}</h2>
            </div>
            <span className="text-3xl">{routine.icon}</span>
          </div>
          <p className="text-sm text-pratica-muted font-light italic mb-4 leading-relaxed">
            &ldquo;{recommendation.message}&rdquo;
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-pratica-muted">
              <span>{formatDuration(recommendation.adjustedDuration)}</span>
              <span>·</span>
              <span className="capitalize">{routine.intensity}</span>
            </div>
            <Link
              href={`/timer?routine=${recommendation.routineType}`}
              className="bg-pratica-green text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-green active:scale-95 transition-transform"
            >
              Inizia
            </Link>
          </div>
        </div>
      )}

      {insight && (
        <div className="pratica-card p-4 mb-4 animate-fade-up stagger-4 border-l-4 border-pratica-blue">
          <p className="text-xs text-pratica-muted uppercase tracking-widest mb-1">Insight</p>
          <p className="font-display text-base text-pratica-text mb-1">{insight.title}</p>
          <p className="text-sm text-pratica-muted font-light leading-relaxed">{insight.body}</p>
        </div>
      )}

      <div className="animate-fade-up stagger-5">
        <p className="text-xs text-pratica-muted uppercase tracking-widest mb-3">Pratiche rapide</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: "/timer?routine=respirazione", icon: "🫁", label: "Respira", color: "#A8B8A0" },
            { href: "/timer?routine=reset", icon: "🔄", label: "Reset", color: "#6E8296" },
            { href: "/timer?routine=gratitudine", icon: "✨", label: "Grazie", color: "#D4A853" },
          ].map(({ href, icon, label, color }) => (
            <Link key={href} href={href} className="pratica-card p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                <span className="text-xl">{icon}</span>
              </div>
              <span className="text-[11px] text-pratica-muted font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
