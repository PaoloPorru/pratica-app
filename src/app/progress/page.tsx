"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  getStreak,
  getWeeklyStats,
  getSessions,
  getDiary,
} from "@/lib/storage";
import type { DayStat } from "@/lib/storage";
import type { StreakData } from "@/lib/types";
import { format, parseISO, isToday } from "date-fns";
import { getMoodEmoji } from "@/lib/utils";
import BottomNav from "@/components/navigation/BottomNav";
import { cn } from "@/lib/utils";

export default function ProgressPage() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [weekStats, setWeekStats] = useState<DayStat[]>([]);
  const [activeDaysSet, setActiveDaysSet] = useState<Set<string>>(new Set());
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgMood, setAvgMood] = useState<number | null>(null);
  const [consistencyPct, setConsistencyPct] = useState(0);

  useEffect(() => {
    const s = getStreak();
    const ws = getWeeklyStats();
    const sessions = getSessions();
    const diary = getDiary();

    setStreak(s);
    setWeekStats(ws);
    setActiveDaysSet(new Set(s.activeDays ?? []));
    setTotalSessions(s.totalSessions);

    // Avg mood last 7 days
    const recentMoods = diary.slice(0, 7);
    if (recentMoods.length) {
      setAvgMood(
        Math.round(recentMoods.reduce((sum, e) => sum + e.mood, 0) / recentMoods.length)
      );
    }

    // Consistency: active days / last 30 days
    const last30 = s.activeDays?.slice(0, 30) ?? [];
    setConsistencyPct(Math.round((last30.length / 30) * 100));
  }, []);

  // Build 30-day calendar grid
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const dateStr = format(d, "yyyy-MM-dd");
    return {
      dateStr,
      active: activeDaysSet.has(dateStr),
      isToday: isToday(d),
    };
  });

  const maxMinutes = Math.max(...weekStats.map((d) => d.minutes), 1);

  return (
    <div className="page-container overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-pratica-muted text-sm">Il tuo percorso</p>
        <h1 className="font-display text-3xl text-pratica-text mt-1">Progressi</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 animate-fade-up">
          <StatCard
            value={streak?.currentStreak ?? 0}
            label="Streak"
            unit={streak?.currentStreak === 1 ? "giorno" : "giorni"}
            color="#A8B8A0"
          />
          <StatCard
            value={streak?.totalMinutes ?? 0}
            label="Minuti"
            unit="totali"
            color="#6E8296"
          />
          <StatCard
            value={consistencyPct}
            label="Costanza"
            unit="%"
            color="#D4A853"
          />
        </div>

        {/* Weekly chart */}
        <div className="pratica-card p-5 animate-fade-up stagger-1">
          <p className="text-xs text-pratica-muted uppercase tracking-widest mb-4">
            Ultimi 7 giorni (minuti)
          </p>
          {weekStats.some((d) => d.minutes > 0) ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weekStats} barSize={24}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#8A8070" }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#F8F6F1",
                    border: "1px solid #E0D8CC",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#2C2C2C",
                  }}
                  formatter={(v: number) => [`${v} min`, ""]}
                  labelFormatter={() => ""}
                />
                <Bar dataKey="minutes" radius={[6, 6, 2, 2]}>
                  {weekStats.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        isToday(parseISO(entry.date))
                          ? "#A8B8A0"
                          : entry.minutes > 0
                          ? "#C8D8C0"
                          : "#E0D8CC"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[120px] flex items-center justify-center">
              <p className="text-sm text-pratica-muted font-light">
                Completa la prima sessione per vedere il grafico
              </p>
            </div>
          )}
        </div>

        {/* Streak calendar */}
        <div className="pratica-card p-5 animate-fade-up stagger-2">
          <p className="text-xs text-pratica-muted uppercase tracking-widest mb-4">
            Ultime 5 settimane
          </p>
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {["L", "M", "M", "G", "V", "S", "D"].map((d, i) => (
              <div key={i} className="text-center text-[10px] text-pratica-muted">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map(({ dateStr, active, isToday }) => (
              <div
                key={dateStr}
                className={cn(
                  "aspect-square rounded-lg transition-all",
                  active
                    ? "bg-pratica-green"
                    : "bg-pratica-border",
                  isToday && "ring-2 ring-pratica-green-dark ring-offset-1"
                )}
                title={dateStr}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 justify-end">
            <div className="w-3 h-3 rounded-sm bg-pratica-border" />
            <span className="text-[10px] text-pratica-muted">Nessuna pratica</span>
            <div className="w-3 h-3 rounded-sm bg-pratica-green" />
            <span className="text-[10px] text-pratica-muted">Praticato</span>
          </div>
        </div>

        {/* Mood trend */}
        <div className="pratica-card p-5 animate-fade-up stagger-3">
          <p className="text-xs text-pratica-muted uppercase tracking-widest mb-4">
            Umore recente
          </p>
          {avgMood ? (
            <div className="flex items-center gap-4">
              <span className="text-5xl">{getMoodEmoji(avgMood)}</span>
              <div>
                <p className="font-display text-xl text-pratica-text">
                  {["Pesante", "Difficile", "Neutro", "Bene", "Ottimo"][avgMood - 1]}
                </p>
                <p className="text-xs text-pratica-muted">
                  Media degli ultimi 7 giorni
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-pratica-muted font-light">
              Registra l'umore nel Diario per vedere il trend
            </p>
          )}
        </div>

        {/* Longest streak */}
        {streak && streak.longestStreak > 0 && (
          <div
            className="pratica-card p-5 animate-fade-up stagger-4"
            style={{ background: "linear-gradient(135deg, rgba(168,184,160,0.12) 0%, rgba(255,255,255,0.9) 100%)" }}
          >
            <p className="text-xs text-pratica-muted uppercase tracking-widest mb-2">
              Record personale
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl text-pratica-green-dark">
                {streak.longestStreak}
              </span>
              <span className="text-pratica-muted">
                {streak.longestStreak === 1 ? "giorno" : "giorni"} consecutivi
              </span>
            </div>
            <p className="text-xs text-pratica-muted mt-2">
              {streak.totalSessions} sessioni totali · {streak.totalMinutes} minuti totali
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function StatCard({
  value, label, unit, color
}: { value: number; label: string; unit: string; color: string }) {
  return (
    <div className="pratica-card p-3 text-center">
      <p className="text-xs text-pratica-muted uppercase tracking-widest mb-1">{label}</p>
      <p className="font-display text-3xl" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] text-pratica-muted mt-0.5">{unit}</p>
    </div>
  );
}
