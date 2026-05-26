// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Routine, RoutineType } from "./types";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "d MMMM", { locale: it });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Notte tranquilla";
  if (h < 12) return "Buongiorno";
  if (h < 17) return "Buon pomeriggio";
  if (h < 21) return "Buona sera";
  return "Buonanotte";
}

export function getMoodEmoji(mood: number): string {
  const emojis = ["😔", "😕", "😐", "🙂", "😊"];
  return emojis[mood - 1] ?? "😐";
}

export function getMoodLabel(mood: number): string {
  const labels = ["Pesante", "Difficile", "Neutro", "Bene", "Ottimo"];
  return labels[mood - 1] ?? "Neutro";
}

export function getEnergyLabel(energy: number): string {
  const labels = ["Esausto", "Stanco", "Nella media", "Energico", "Pieno di energia"];
  return labels[energy - 1] ?? "Nella media";
}

// ─── Routine Library ─────────────────────────────────────────────────────────

export const ROUTINES: Record<RoutineType, Routine> = {
  centratura: {
    id: "centratura",
    type: "centratura",
    name: "Centratura",
    description: "Torna a te stesso in 5 minuti. Respiro, ascolto, presenza.",
    duration: 300,
    icon: "🌿",
    color: "#A8B8A0",
    intensity: "leggera",
    tags: ["mattino", "pausa", "consapevolezza"],
    steps: [
      {
        id: "c1",
        name: "Siediti",
        duration: 20,
        instruction: "Trovati una posizione comoda. Schiena diritta ma non rigida.",
      },
      {
        id: "c2",
        name: "Tre respiri profondi",
        duration: 30,
        instruction: "Inspira lentamente dal naso (4s), esala dalla bocca (6s). Tre volte.",
        breathPhase: "inhale",
      },
      {
        id: "c3",
        name: "Osserva il corpo",
        duration: 60,
        instruction: "Porta l'attenzione al corpo. Dove senti tensione? Lasciala essere.",
      },
      {
        id: "c4",
        name: "Respiro naturale",
        duration: 120,
        instruction: "Osserva il respiro senza modificarlo. Ogni volta che la mente vaga, riporta qui.",
        breathPhase: "exhale",
      },
      {
        id: "c5",
        name: "Intenzione",
        duration: 60,
        instruction: "Una parola o frase per il tuo giorno. Portala con te.",
      },
      {
        id: "c6",
        name: "Chiusura",
        duration: 10,
        instruction: "Apri lentamente gli occhi. Sei pronto.",
      },
    ],
  },

  gratitudine: {
    id: "gratitudine",
    type: "gratitudine",
    name: "Gratitudine",
    description: "Tre cose. Anche piccole. Cambiano il filtro con cui vedi.",
    duration: 180,
    icon: "✨",
    color: "#D4A853",
    intensity: "leggera",
    tags: ["riflessione", "umore", "sera"],
    steps: [
      {
        id: "g1",
        name: "Prepara",
        duration: 20,
        instruction: "Chiudi gli occhi. Rilassa le spalle. Nessuna fretta.",
      },
      {
        id: "g2",
        name: "Prima cosa",
        duration: 40,
        instruction: "Pensa a qualcosa che è andata bene oggi. Anche minima. Senti il calore.",
      },
      {
        id: "g3",
        name: "Seconda cosa",
        duration: 40,
        instruction: "Una persona, un momento, un dettaglio. Visualizzalo.",
      },
      {
        id: "g4",
        name: "Terza cosa",
        duration: 40,
        instruction: "Qualcosa che hai in questo momento. Il respiro, il tetto, la salute.",
      },
      {
        id: "g5",
        name: "Sigilla",
        duration: 40,
        instruction: "Rimani con questa sensazione per un momento. Portala nel resto del giorno.",
      },
    ],
  },

  reset: {
    id: "reset",
    type: "reset",
    name: "Reset",
    description: "2 minuti per scaricare e ricominciare. Per quando tutto pesa.",
    duration: 120,
    icon: "🔄",
    color: "#6E8296",
    intensity: "leggera",
    tags: ["stress", "pausa", "urgente"],
    steps: [
      {
        id: "r1",
        name: "Stop",
        duration: 10,
        instruction: "Fermati. Tutto il resto aspetta.",
      },
      {
        id: "r2",
        name: "Respiro 4-4-6",
        duration: 42,
        instruction: "Inspira 4s. Tieni 4s. Esala 6s. Due volte. Regola il sistema nervoso.",
        breathPhase: "inhale",
      },
      {
        id: "r3",
        name: "Lascia andare",
        duration: 38,
        instruction: "Con ogni espirazione, immagina di lasciare qualcosa. Tensione, pensiero, urgenza.",
        breathPhase: "exhale",
      },
      {
        id: "r4",
        name: "Riparti",
        duration: 30,
        instruction: "Un'unica cosa. Cosa è davvero importante adesso?",
      },
    ],
  },

  focus: {
    id: "focus",
    type: "focus",
    name: "Focus",
    description: "25 minuti di lavoro profondo. Una cosa sola, fatta bene.",
    duration: 1500,
    icon: "🎯",
    color: "#8B6E9E",
    intensity: "intensa",
    tags: ["lavoro", "produttività", "mattino"],
    steps: [
      {
        id: "f1",
        name: "Intenzione",
        duration: 60,
        instruction: "Scrivi o pensa a UNA sola cosa che vuoi completare in questa sessione.",
      },
      {
        id: "f2",
        name: "Respiro di attivazione",
        duration: 60,
        instruction: "Tre respiri profondi. Con l'ultimo, senti la mente che si affila.",
        breathPhase: "inhale",
      },
      {
        id: "f3",
        name: "Lavoro profondo",
        duration: 1200,
        instruction: "Lavora. Se la mente vaga, nota il pensiero senza giudicare e torna al task.",
      },
      {
        id: "f4",
        name: "Chiusura",
        duration: 120,
        instruction: "Scrivi cos'hai completato. Riconosci il lavoro fatto.",
      },
      {
        id: "f5",
        name: "Respiro finale",
        duration: 60,
        instruction: "Tre respiri lenti. Poi una pausa di 5 minuti prima di continuare.",
        breathPhase: "exhale",
      },
    ],
  },

  scarico: {
    id: "scarico",
    type: "scarico",
    name: "Scarico",
    description: "Fine giornata. Deposita quel che hai portato e lascialo andare.",
    duration: 300,
    icon: "🌙",
    color: "#7B8FA8",
    intensity: "leggera",
    tags: ["sera", "rilassamento", "sonno"],
    steps: [
      {
        id: "s1",
        name: "Comodati",
        duration: 20,
        instruction: "Sdraiati o siediti. Nessun compito. Nessun obiettivo.",
      },
      {
        id: "s2",
        name: "Scan corporeo",
        duration: 120,
        instruction: "Parti dai piedi. Porta attenzione e poi rilascia: piedi, gambe, addome, petto, spalle, collo, viso.",
      },
      {
        id: "s3",
        name: "Lascia la giornata",
        duration: 60,
        instruction: "Cosa vuoi lasciare fuori dalla porta stanotte? Non importa risolvere. Solo depositare.",
      },
      {
        id: "s4",
        name: "Respiro notturno",
        duration: 80,
        instruction: "Respira più lentamente di quanto pensi sia necessario. 5s in, 8s fuori.",
        breathPhase: "exhale",
      },
      {
        id: "s5",
        name: "Gratitudine finale",
        duration: 20,
        instruction: "Una cosa sola di oggi che è stata degna di nota.",
      },
    ],
  },

  mattino: {
    id: "mattino",
    type: "mattino",
    name: "Routine Mattino",
    description: "10 minuti per impostare il tono del giorno. Il mattino è tuo.",
    duration: 600,
    icon: "🌅",
    color: "#E8A87C",
    intensity: "media",
    tags: ["mattino", "routine", "energia"],
    steps: [
      {
        id: "m1",
        name: "Risveglio",
        duration: 30,
        instruction: "Prima di alzarti: tre respiri profondi. Senti il corpo che si sveglia.",
        breathPhase: "inhale",
      },
      {
        id: "m2",
        name: "Movimento leggero",
        duration: 120,
        instruction: "Muovi lentamente collo, spalle, polsi. Sveglia il corpo senza fretta.",
      },
      {
        id: "m3",
        name: "Presenza",
        duration: 120,
        instruction: "Siediti. Osserva dove sei. Senza telefono. Solo questo momento.",
      },
      {
        id: "m4",
        name: "Intenzione del giorno",
        duration: 60,
        instruction: "Una parola. Un tema. Come vuoi essere oggi?",
      },
      {
        id: "m5",
        name: "Una gratitudine",
        duration: 60,
        instruction: "Qualcosa — anche semplice — per cui sei grato stamattina.",
      },
      {
        id: "m6",
        name: "Respiro di inizio",
        duration: 60,
        instruction: "Cinque respiri profondi. Con l'ultimo, inizia il tuo giorno.",
        breathPhase: "inhale",
      },
      {
        id: "m7",
        name: "Impegno",
        duration: 150,
        instruction: "Scrivi o pensa: le tre cose più importanti di oggi. Solo tre.",
      },
    ],
  },

  respirazione: {
    id: "respirazione",
    type: "respirazione",
    name: "Respirazione",
    description: "Il respiro regola tutto. 4 minuti sufficienti a cambiare lo stato.",
    duration: 240,
    icon: "🫁",
    color: "#A8B8A0",
    intensity: "leggera",
    tags: ["respiro", "ansia", "reset", "pausa"],
    steps: [
      {
        id: "br1",
        name: "Preparazione",
        duration: 20,
        instruction: "Siediti con la schiena dritta. Metti una mano sul petto e una sull'addome.",
      },
      {
        id: "br2",
        name: "4-4-6-2 (×5)",
        duration: 80,
        instruction: "Inspira 4s. Tieni 4s. Esala 6s. Pausa 2s. Ripeti 5 volte. Respira con l'addome.",
        breathPhase: "inhale",
      },
      {
        id: "br3",
        name: "Respiro naturale",
        duration: 60,
        instruction: "Lascia tornare il respiro naturale. Osserva solo.",
      },
      {
        id: "br4",
        name: "5-0-7 (×4)",
        duration: 48,
        instruction: "Inspira 5s. Esala 7s. Quattro volte. Per il sistema parasimpatico.",
        breathPhase: "exhale",
      },
      {
        id: "br5",
        name: "Pausa finale",
        duration: 32,
        instruction: "Rimani con la sensazione. Calmo. Presente. Pronto.",
      },
    ],
  },

  meditazione: {
    id: "meditazione",
    type: "meditazione",
    name: "Meditazione",
    description: "10 minuti di quiete consapevole. Non svuotare la mente. Osservarla.",
    duration: 600,
    icon: "🧘",
    color: "#9E8BB5",
    intensity: "media",
    tags: ["meditazione", "consapevolezza", "silenzio"],
    steps: [
      {
        id: "med1",
        name: "Assestati",
        duration: 60,
        instruction: "Trova una posizione che puoi mantenere. Chiudi gli occhi. Nessuna aspettativa.",
      },
      {
        id: "med2",
        name: "Connetti al respiro",
        duration: 60,
        instruction: "Osserva il respiro. Non modificarlo. Solo osservare. In. Fuori.",
        breathPhase: "inhale",
      },
      {
        id: "med3",
        name: "Presenza aperta",
        duration: 360,
        instruction: "Quando la mente vaga — e lo farà — nota il pensiero con gentilezza e torna al respiro. Non è fallire. È la pratica.",
      },
      {
        id: "med4",
        name: "Espansione",
        duration: 60,
        instruction: "Allarga la consapevolezza: suoni, sensazioni, spazio intorno a te.",
      },
      {
        id: "med5",
        name: "Chiusura dolce",
        duration: 60,
        instruction: "Porta il pollice e l'indice insieme. Tre respiri. Poi apri lentamente gli occhi.",
      },
    ],
  },
};

export function getRoutinesByTag(tag: string): Routine[] {
  return Object.values(ROUTINES).filter((r) => r.tags.includes(tag));
}

export function getAllRoutines(): Routine[] {
  return Object.values(ROUTINES);
}

export function getRoutineById(id: string): Routine | null {
  return ROUTINES[id as RoutineType] ?? null;
}
