// src/lib/storage.ts
"use client";

import type {
  UserProfile,
  DiaryEntry,
  PracticeSession,
  StreakData,
  AppState,
} from "./types";
import { format, differenceInDays, parseISO, isToday, isYesterday } from "date-fns";

const KEYS = {
  PROFILE: "pratica:profile",
  DIARY: "pratica:diary",
  SESSIONS: "pratica:sessions",
  STREAK: "pratica:streak",
  STATE: "pratica:state",
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Storage write failed:", e);
  }
}

// ─── Profile ────────────────────────────────────────────────────────────────

export function getProfile(): UserProfile | null {
  return safeGet<UserProfile | null>(KEYS.PROFILE, null);
}

export function saveProfile(profile: UserProfile): void {
  safeSet(KEYS.PROFILE, profile);
}

export function updateProfile(partial: Partial<UserProfile>): void {
  const existing = getProfile();
  if (existing) {
    safeSet(KEYS.PROFILE, { ...existing, ...partial });
  }
}

// ─── Diary ──────────────────────────────────────────────────────────────────

export function getDiary(): DiaryEntry[] {
  return safeGet<DiaryEntry[]>(KEYS.DIARY, []);
}

export function saveDiaryEntry(entry: DiaryEntry): void {
  const diary = getDiary();
  const idx = diary.findIndex((e) => e.date === entry.date);
  if (idx >= 0) {
    diary[idx] = entry;
  } else {
    diary.unshift(entry);
  }
  safeSet(KEYS.DIARY, diary);
}

export function getTodayDiaryEntry(): DiaryEntry | null {
  const today = format(new Date(), "yyyy-MM-dd");
  const diary = getDiary();
  return diary.find((e) => e.date === today) ?? null;
}

export function getRecentDiaryEntries(days = 30): DiaryEntry[] {
  const diary = getDiary();
  return diary.slice(0, days);
}

// ─── Sessions ───────────────────────────────────────────────────────────────

export function getSessions(): PracticeSession[] {
  return safeGet<PracticeSession[]>(KEYS.SESSIONS, []);
}

export function saveSession(session: PracticeSession): void {
  const sessions = getSessions();
  sessions.unshift(session);
  safeSet(KEYS.SESSIONS, sessions);
  updateStreak(session.date);
}

export function getRecentSessions(days = 30): PracticeSession[] {
  return getSessions().slice(0, days * 3);
}

export function getTodaySessions(): PracticeSession[] {
  const today = format(new Date(), "yyyy-MM-dd");
  return getSessions().filter((s) => s.date === today);
}

// ─── Streak ─────────────────────────────────────────────────────────────────

export function getStreak(): StreakData {
  return safeGet<StreakData>(KEYS.STREAK, {
    currentStreak: 0,
    longestStreak: 0,
    totalSessions: 0,
    totalMinutes: 0,
    lastPracticeDate: null,
    activeDays: [],
  });
}

export function updateStreak(practiceDate: string): void {
  const streak = getStreak();
  const sessions = getSessions();

  // Recalculate from scratch
  const uniqueDays = [...new Set(sessions.map((s) => s.date))].sort().reverse();
  const activeDays = uniqueDays;

  let currentStreak = 0;
  let checkDate = new Date();

  for (const day of activeDays) {
    const d = parseISO(day);
    const diff = differenceInDays(checkDate, d);
    if (diff === 0 || diff === 1) {
      currentStreak++;
      checkDate = d;
    } else {
      break;
    }
  }

  const totalMinutes = Math.floor(
    sessions.filter((s) => s.completed).reduce((sum, s) => sum + s.duration, 0) / 60
  );

  const updated: StreakData = {
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    totalSessions: sessions.filter((s) => s.completed).length,
    totalMinutes,
    lastPracticeDate: practiceDate,
    activeDays: activeDays.slice(0, 90),
  };

  safeSet(KEYS.STREAK, updated);
}

// ─── Weekly stats ────────────────────────────────────────────────────────────

export interface DayStat {
  date: string;
  label: string;
  minutes: number;
  sessions: number;
}

export function getWeeklyStats(): DayStat[] {
  const sessions = getSessions();
  const result: DayStat[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const label = format(d, "EEE");
    const daySessions = sessions.filter((s) => s.date === dateStr && s.completed);
    const minutes = Math.floor(daySessions.reduce((sum, s) => sum + s.duration, 0) / 60);
    result.push({ date: dateStr, label, minutes, sessions: daySessions.length });
  }

  return result;
}

// ─── Full reset ──────────────────────────────────────────────────────────────

export function resetAll(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

// ─── IndexedDB stub (prepared for future expansion) ─────────────────────────

export const IndexedDBStorage = {
  isAvailable: (): boolean => typeof indexedDB !== "undefined",

  async init(): Promise<IDBDatabase | null> {
    if (!this.isAvailable()) return null;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("PraticaDB", 1);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("sessions")) {
          db.createObjectStore("sessions", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("diary")) {
          db.createObjectStore("diary", { keyPath: "id" });
        }
      };
      req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
      req.onerror = () => reject(req.error);
    });
  },

  // Future: migrate from localStorage to IndexedDB
  async migrate(): Promise<void> {
    const db = await this.init();
    if (!db) return;
    console.log("IndexedDB ready for future migration:", db.name);
  },
};
