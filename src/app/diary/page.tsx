"use client";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  getTodayDiaryEntry,
  saveDiaryEntry,
  getRecentDiaryEntries,
} from "@/lib/storage";
import { generateId, getMoodEmoji, getMoodLabel, getEnergyLabel, cn } from "@/lib/utils";
import type { DiaryEntry, MoodType } from "@/lib/types";
import BottomNav from "@/components/navigation/BottomNav";

export default function DiaryPage() {
  const [mood, setMood] = useState<MoodType | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const todayEntry = getTodayDiaryEntry();
    if (todayEntry) {
      setMood(todayEntry.mood);
      setEnergy(todayEntry.energy);
      setNote(todayEntry.note);
      setSaved(true);
    }
    setEntries(getRecentDiaryEntries(30));
  }, []);

  function handleSave() {
    if (!mood || !energy) return;
    const entry: DiaryEntry = {
      id: generateId(),
      date: today,
      mood,
      energy,
      note,
      practicesCompleted: [],
      createdAt: new Date().toISOString(),
    };
    saveDiaryEntry(entry);
    setSaved(true);
    setEntries(getRecentDiaryEntries(30));
  }

  return (
    <div className="page-container overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-pratica-muted text-sm">
          {format(new Date(), "EEEE d MMMM", { locale: it })}
        </p>
        <h1 className="font-display text-3xl text-pratica-text mt-1">Diario</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-6">
        {(["today", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-pratica-green text-white"
                : "text-pratica-muted bg-pratica-warm"
            )}
          >
            {tab === "today" ? "Oggi" : "Cronologia"}
          </button>
        ))}
      </div>

      {activeTab === "today" && (
        <div className="px-4 space-y-5 animate-fade-up">
          {/* Mood */}
          <div className="pratica-card p-5">
            <p className="text-xs text-pratica-muted uppercase tracking-widest mb-4">
              Come stai oggi?
            </p>
            <div className="flex justify-between gap-2">
              {([1, 2, 3, 4, 5] as MoodType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => { setMood(v); setSaved(false); }}
                  className={cn(
                    "mood-btn flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200",
                    mood === v
                      ? "bg-pratica-green-light shadow-green selected"
                      : "bg-pratica-warm"
                  )}
                >
                  <span className="text-2xl">{getMoodEmoji(v)}</span>
                  <span className="text-[10px] text-pratica-muted font-medium">{getMoodLabel(v)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div className="pratica-card p-5">
            <p className="text-xs text-pratica-muted uppercase tracking-widest mb-4">
              Livello di energia
            </p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((v) => (
                <button
                  key={v}
                  onClick={() => { setEnergy(v); setSaved(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all",
                    energy === v ? "bg-pratica-green-light" : "hover:bg-pratica-warm"
                  )}
                >
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-1.5 h-3 rounded-full transition-colors",
                          i < v ? "bg-pratica-green" : "bg-pratica-border"
                        )}
                      />
                    ))}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    energy === v ? "text-pratica-green-dark" : "text-pratica-muted"
                  )}>
                    {getEnergyLabel(v)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="pratica-card p-5">
            <p className="text-xs text-pratica-muted uppercase tracking-widest mb-3">
              Note (opzionale)
            </p>
            <textarea
              value={note}
              onChange={(e) => { setNote(e.target.value); setSaved(false); }}
              placeholder="Come è andata la giornata? Cosa hai notato?"
              rows={4}
              className="w-full bg-transparent outline-none resize-none text-sm text-pratica-text placeholder:text-pratica-border font-light leading-relaxed"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!mood || !energy}
            className={cn(
              "w-full py-4 rounded-2xl font-medium text-base transition-all duration-200 mb-4",
              mood && energy
                ? saved
                  ? "bg-pratica-green-light text-pratica-green-dark"
                  : "bg-pratica-green text-white shadow-green active:scale-98"
                : "bg-pratica-border text-pratica-muted"
            )}
          >
            {saved ? "✓ Salvato" : "Salva"}
          </button>
        </div>
      )}

      {activeTab === "history" && (
        <div className="px-4 space-y-3 animate-fade-up">
          {entries.length === 0 ? (
            <div className="text-center py-16 text-pratica-muted">
              <p className="text-4xl mb-3">📓</p>
              <p className="font-display text-xl mb-1">Nessun record ancora</p>
              <p className="text-sm font-light">Inizia registrando l'umore di oggi</p>
            </div>
          ) : (
            entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`pratica-card p-4 animate-fade-up stagger-${Math.min(i + 1, 6)}`}
                style={{ opacity: 0, animationFillMode: "forwards" }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-pratica-muted capitalize">
                      {format(parseISO(entry.date), "EEEE d MMM", { locale: it })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getMoodEmoji(entry.mood)}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1 h-2.5 rounded-full",
                            i < entry.energy ? "bg-pratica-green" : "bg-pratica-border"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {entry.note && (
                  <p className="text-sm text-pratica-muted font-light leading-relaxed line-clamp-2">
                    {entry.note}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
