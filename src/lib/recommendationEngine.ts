// src/lib/recommendationEngine.ts
/**
 * PRATICA — Adaptive Recommendation Engine
 *
 * Zero dependencies. Zero API calls. Zero cost.
 * Powered by heuristic logic and user history.
 *
 * Optional hooks are provided for Ollama/Llama3/Mistral/Gemma when available.
 */

import type {
  UserProfile,
  PracticeSession,
  DiaryEntry,
  CoachRecommendation,
  RoutineType,
  GoalType,
} from "./types";
import { format, parseISO, differenceInDays } from "date-fns";

// ─── Ollama (optional, local AI) ────────────────────────────────────────────

export interface OllamaConfig {
  baseUrl: string;       // e.g. "http://localhost:11434"
  model: string;         // "llama3", "mistral", "gemma", "phi3"
}

async function queryOllama(
  config: OllamaConfig,
  prompt: string
): Promise<string | null> {
  try {
    const res = await fetch(`${config.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 200 },
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.response ?? null;
  } catch {
    return null; // Ollama not available — fallback to heuristics
  }
}

// ─── Heuristic Engine ───────────────────────────────────────────────────────

interface EngineContext {
  profile: UserProfile;
  sessions: PracticeSession[];
  diary: DiaryEntry[];
  now?: Date;
}

function getHourNow(now: Date): number {
  return now.getHours() + now.getMinutes() / 60;
}

function getConsecutiveSkipped(sessions: PracticeSession[], now: Date): number {
  let skipped = 0;
  const today = format(now, "yyyy-MM-dd");

  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const hasSession = sessions.some((s) => s.date === dateStr && s.completed);
    if (!hasSession) skipped++;
    else break;
  }
  return skipped;
}

function getCurrentStreak(sessions: PracticeSession[], now: Date): number {
  const uniqueDays = [
    ...new Set(sessions.filter((s) => s.completed).map((s) => s.date)),
  ].sort().reverse();

  let streak = 0;
  let checkDate = now;

  for (const day of uniqueDays) {
    const d = parseISO(day);
    const diff = differenceInDays(checkDate, d);
    if (diff <= 1) {
      streak++;
      checkDate = d;
    } else break;
  }
  return streak;
}

function getAvgMood(diary: DiaryEntry[], days = 7): number {
  const recent = diary.slice(0, days);
  if (!recent.length) return 3;
  return recent.reduce((sum, e) => sum + e.mood, 0) / recent.length;
}

function getAvgEnergy(diary: DiaryEntry[], days = 7): number {
  const recent = diary.slice(0, days);
  if (!recent.length) return 3;
  return recent.reduce((sum, e) => sum + e.energy, 0) / recent.length;
}

function getTimeBasedRoutine(hour: number, goals: GoalType[]): RoutineType {
  if (hour < 9) {
    // Morning: centering + breathing
    if (goals.includes("focus")) return "centratura";
    return "mattino";
  }
  if (hour < 12) {
    // Late morning: focus
    if (goals.includes("focus") || goals.includes("disciplina")) return "focus";
    return "centratura";
  }
  if (hour < 14) {
    // Around noon: brief reset
    return "reset";
  }
  if (hour < 17) {
    // Afternoon: sustained focus
    return "focus";
  }
  if (hour < 20) {
    // Early evening: gratitude/wind-down
    return "gratitudine";
  }
  // Night: release
  return "scarico";
}

function getDurationMultiplier(
  streak: number,
  skipped: number,
  mood: number,
  energy: number
): number {
  let multiplier = 1.0;

  // Streak-based scaling
  if (streak >= 30) multiplier *= 1.25;
  else if (streak >= 14) multiplier *= 1.15;
  else if (streak >= 7) multiplier *= 1.1;

  // Skipped days: reduce intensity
  if (skipped >= 3) multiplier *= 0.6;
  else if (skipped >= 2) multiplier *= 0.75;
  else if (skipped >= 1) multiplier *= 0.9;

  // Low energy/mood: reduce
  if (energy <= 2 || mood <= 2) multiplier *= 0.8;
  if (energy >= 4 && mood >= 4) multiplier *= 1.05;

  return Math.min(Math.max(multiplier, 0.5), 1.5);
}

const ROUTINE_MESSAGES: Record<string, string[]> = {
  centratura: [
    "Inizia da qui. Un respiro, poi il giorno.",
    "Il centro è sempre disponibile.",
    "Trovati prima di fare qualsiasi cosa.",
  ],
  gratitudine: [
    "Cosa noti di buono, anche di piccolo?",
    "La gratitudine cambia il filtro con cui vedi.",
    "Tre cose. Anche minuscole.",
  ],
  reset: [
    "Metti giù il peso per qualche minuto.",
    "Non serve azzerare tutto. Solo ricominciare.",
    "Una pausa intenzionale vale ore di reazione.",
  ],
  focus: [
    "Un'unica cosa. Fatta bene. Poi la prossima.",
    "Il focus si allena come un muscolo.",
    "Blocca il rumore. Lascia solo ciò che conta.",
  ],
  scarico: [
    "Scarica quel che hai portato oggi.",
    "Il corpo ricorda. Dategli il permesso di lasciare andare.",
    "Fine giornata: deposita il peso.",
  ],
  mattino: [
    "Il mattino decide il tono del giorno.",
    "Prima di reagire al mondo, inizia da te.",
    "Pochi minuti adesso, ore migliori dopo.",
  ],
  respirazione: [
    "Il respiro è sempre lì, gratuito e potente.",
    "Inspira lentamente. L'ansia abita nella fretta.",
    "Tutto si sistema con il respiro giusto.",
  ],
  meditazione: [
    "Stare fermi è la pratica più difficile.",
    "Non svuotare la mente. Osservala.",
    "La quiete non è assenza. È presenza.",
  ],
};

function getCoachMessage(
  routineType: RoutineType,
  skipped: number,
  streak: number,
  stressLevel: number
): string {
  const messages = ROUTINE_MESSAGES[routineType] ?? ["Inizia la tua pratica."];

  if (stressLevel >= 4) {
    return "Lo stress è alto. Questo è il momento più importante per fermarsi.";
  }
  if (skipped >= 2) {
    return "Bentornato. Nessun giudizio. Ricominciamo con qualcosa di leggero.";
  }
  if (streak >= 21) {
    return `${streak} giorni consecutivi. La costanza sta cambiando qualcosa in te.`;
  }
  if (streak >= 7) {
    return `Una settimana di fila. Il ritmo sta diventando tuo.`;
  }
  if (streak === 1) {
    return "Ogni grande abitudine inizia con un secondo giorno.";
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

// ─── Base Durations per Routine (seconds) ───────────────────────────────────

const BASE_DURATIONS: Record<RoutineType, number> = {
  centratura: 300,    // 5 min
  gratitudine: 180,   // 3 min
  reset: 120,         // 2 min
  focus: 1500,        // 25 min
  scarico: 300,       // 5 min
  mattino: 600,       // 10 min
  respirazione: 240,  // 4 min
  meditazione: 600,   // 10 min
};

// ─── Main Recommend Function ─────────────────────────────────────────────────

export async function getRecommendation(
  ctx: EngineContext,
  ollamaConfig?: OllamaConfig
): Promise<CoachRecommendation> {
  const { profile, sessions, diary } = ctx;
  const now = ctx.now ?? new Date();

  const hour = getHourNow(now);
  const skipped = getConsecutiveSkipped(sessions, now);
  const streak = getCurrentStreak(sessions, now);
  const avgMood = getAvgMood(diary);
  const avgEnergy = getAvgEnergy(diary);
  const stressLevel = profile.stressLevel;

  // Determine best routine
  let routineType: RoutineType;

  if (stressLevel >= 4 || avgMood <= 2) {
    routineType = "reset";
  } else if (skipped >= 3) {
    routineType = "respirazione"; // gentlest restart
  } else {
    routineType = getTimeBasedRoutine(hour, profile.goals);
  }

  // Calculate duration
  const baseDuration = BASE_DURATIONS[routineType];
  const multiplier = getDurationMultiplier(streak, skipped, avgMood, avgEnergy);
  const adjustedDuration = Math.round(baseDuration * multiplier);

  // Coach message
  let message = getCoachMessage(routineType, skipped, streak, stressLevel);

  // Optional: enrich with Ollama if available
  if (ollamaConfig) {
    const prompt = `Sei un coach di mindfulness gentile. Suggerisci in italiano in 1 frase breve e calma perché questa persona dovrebbe fare una pratica di "${routineType}" oggi. Streak: ${streak} giorni. Stress: ${stressLevel}/5. Umore medio: ${avgMood.toFixed(1)}/5. Solo la frase, nient'altro.`;
    const aiMessage = await queryOllama(ollamaConfig, prompt);
    if (aiMessage) message = aiMessage.trim();
  }

  const priority: CoachRecommendation["priority"] =
    stressLevel >= 4 || skipped >= 2 ? "alta" : streak >= 7 ? "media" : "bassa";

  return {
    routineId: routineType,
    routineType,
    reason: buildReason(skipped, streak, stressLevel, hour),
    adjustedDuration,
    priority,
    message,
  };
}

function buildReason(
  skipped: number,
  streak: number,
  stress: number,
  hour: number
): string {
  if (stress >= 4) return "stress_alto";
  if (skipped >= 2) return "pratica_saltata";
  if (streak >= 7) return "costanza_alta";
  if (hour < 9) return "mattino";
  if (hour >= 20) return "sera";
  return "default";
}

// ─── Energy Calculator ───────────────────────────────────────────────────────

export function calculateEnergyLevel(
  profile: UserProfile,
  diary: DiaryEntry[]
): number {
  const now = new Date();
  const hour = now.getHours();

  // Base from wake/sleep rhythm
  const [wakeH] = profile.wakeTime.split(":").map(Number);
  const [sleepH] = profile.sleepTime.split(":").map(Number);
  const sleepDuration =
    sleepH > wakeH ? sleepH - wakeH : 24 - wakeH + sleepH;
  const sleepScore = Math.min(sleepDuration / 8, 1);

  // Circadian rhythm approximation
  const hoursAwake = hour - wakeH;
  let circadian = 1.0;
  if (hoursAwake < 2) circadian = 0.7;
  else if (hoursAwake < 4) circadian = 0.9;
  else if (hoursAwake < 6) circadian = 1.0;
  else if (hoursAwake < 8) circadian = 0.85;
  else if (hoursAwake > 12) circadian = 0.75;

  // Recent diary energy
  const recentEnergy = getAvgEnergy(diary, 3);

  const raw = sleepScore * 3 + circadian * 2 + (recentEnergy / 5) * 2;
  return Math.min(Math.max(Math.round(raw), 1), 5);
}

// ─── Insight Generator ───────────────────────────────────────────────────────

export interface WeeklyInsight {
  title: string;
  body: string;
  type: "streak" | "mood" | "pattern" | "encouragement";
}

export function generateWeeklyInsight(
  sessions: PracticeSession[],
  diary: DiaryEntry[],
  streak: number
): WeeklyInsight {
  const avgMood = getAvgMood(diary, 7);
  const thisWeekSessions = sessions.filter((s) => {
    const d = parseISO(s.date);
    return differenceInDays(new Date(), d) <= 7 && s.completed;
  }).length;

  if (streak >= 14) {
    return {
      type: "streak",
      title: "La costanza è potere",
      body: `${streak} giorni consecutivi. L'abitudine è diventata parte di te.`,
    };
  }
  if (avgMood >= 4) {
    return {
      type: "mood",
      title: "Settimana brillante",
      body: "Il tuo umore questa settimana è stato alto. La pratica si sente.",
    };
  }
  if (thisWeekSessions >= 5) {
    return {
      type: "pattern",
      title: "Ritmo solido",
      body: `${thisWeekSessions} sessioni questa settimana. Stai costruendo qualcosa di reale.`,
    };
  }
  if (streak === 0 && thisWeekSessions > 0) {
    return {
      type: "encouragement",
      title: "Ricominciare conta",
      body: "Hai praticato questa settimana. Il ritmo si ricostruisce un giorno alla volta.",
    };
  }
  return {
    type: "encouragement",
    title: "Ogni giorno è nuovo",
    body: "La pratica perfetta non esiste. Esiste quella che fai.",
  };
}
