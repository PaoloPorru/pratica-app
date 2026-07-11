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

  // ─────────────────────────────────────────────────────────────────
  centratura: {
    id: "centratura",
    type: "centratura",
    name: "Centratura",
    description: "Torna a te stesso in cinque minuti. Un respiro, poi il giorno.",
    duration: 300,
    icon: "🌿",
    color: "#A8B8A0",
    intensity: "leggera",
    tags: ["mattino", "pausa", "consapevolezza"],
    steps: [
      {
        id: "c1",
        name: "Siediti con intenzione",
        duration: 25,
        instruction: "Trova una posizione che ti sostenga senza costringerti. Lascia che la schiena si alzi naturalmente, come un albero che cresce verso il cielo. Le mani possono riposare sulle ginocchia, aperte o chiuse — segui quello che senti. Questo momento è tuo.",
      },
      {
        id: "c2",
        name: "Il respiro che sveglia",
        duration: 35,
        instruction: "Porta tutta la tua attenzione al respiro. Non modificarlo — osservalo. Senti l'aria fresca che entra dalle narici, scende nella gola, riempie il petto. Poi l'espirazione, lenta, che porta via con sé ciò che non serve. Tre volte così. Lasciati portare.",
        breathPhase: "inhale",
      },
      {
        id: "c3",
        name: "Ascolta il corpo",
        duration: 70,
        instruction: "Porta ora l'attenzione al tuo corpo, come un esploratore curioso e gentile. Dove senti tensione? Nelle spalle, nella mascella, nel petto? Non cercare di cambiare nulla. Riconosci semplicemente: eccola, è lì. La consapevolezza stessa è già guarigione. Respira dentro quei luoghi.",
      },
      {
        id: "c4",
        name: "Presenza silenziosa",
        duration: 120,
        instruction: "Adesso lascia andare ogni sforzo. Siediti semplicemente — senza fare, senza ottenere, senza arrivare da nessuna parte. Sei già qui. Ogni volta che la mente se ne va — verso i pensieri, i piani, i ricordi — riportala con dolcezza, senza giudizio, come si farebbe con un bambino distratto. Il respiro è sempre lì ad aspettarti.",
        breathPhase: "exhale",
      },
      {
        id: "c5",
        name: "Semina l'intenzione",
        duration: 35,
        instruction: "Prima di rientrare nel giorno, ferma un istante ancora. Chiedi a te stesso: come voglio essere oggi? Non cosa voglio fare — come voglio essere. Una parola, forse: presente, gentile, coraggioso. Portala con te come un seme che già porta in sé il fiore.",
      },
      {
        id: "c6",
        name: "Ritorno",
        duration: 15,
        instruction: "Muovi lentamente le dita, poi i polsi. Apri gli occhi con calma, come se stessi incontrando il mondo per la prima volta. Sei pronto.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  gratitudine: {
    id: "gratitudine",
    type: "gratitudine",
    name: "Gratitudine",
    description: "Tre cose. Anche piccole. Cambiano il filtro con cui vedi tutto il resto.",
    duration: 180,
    icon: "✨",
    color: "#D4A853",
    intensity: "leggera",
    tags: ["riflessione", "umore", "sera"],
    steps: [
      {
        id: "g1",
        name: "Fermati e mettiti al caldo",
        duration: 25,
        instruction: "Chiudi gli occhi. Lascia cadere le spalle. Respira una volta, lentamente. Non c'è niente che devi risolvere adesso. Per i prossimi tre minuti, il tuo unico compito è ricevere — lasciare che il bene già presente nella tua vita arrivi a coscienza.",
      },
      {
        id: "g2",
        name: "La prima luce",
        duration: 45,
        instruction: "Pensa a qualcosa che è andata bene oggi. Anche un momento piccolo — una tazza di caffè caldo, una parola gentile, un raggio di sole sulla pelle. Non devi scegliere la cosa più importante. Scegli quella che ti scalda di più. Resta lì. Lascia che quella sensazione si espanda nel petto. Il cervello impara ciò a cui presta attenzione — e tu stai scegliendo di prestare attenzione a questo.",
      },
      {
        id: "g3",
        name: "Una persona, un gesto",
        duration: 45,
        instruction: "Pensa ora a una persona — vicina o lontana, presente o passata — che in qualche modo ha contribuito a chi sei. Non serve che sia un gesto grande. Forse ti ha ascoltato quando ne avevi bisogno. Forse semplicemente esiste. Lascia che il tuo cuore si ammorbidisca verso di lei. La gratitudine verso gli altri è il modo più veloce per uscire da sé stessi.",
      },
      {
        id: "g4",
        name: "Il dono invisibile",
        duration: 45,
        instruction: "E adesso — qualcosa che hai in questo preciso momento e che spesso dimentichi. Il respiro che ti sostiene senza che tu lo chieda. Un corpo che ti porta attraverso il mondo. Un tetto. La capacità di pensare, di sentire, di cambiare. Questi non sono dettagli — sono fondamenta. Riconoscili con umiltà.",
      },
      {
        id: "g5",
        name: "Sigilla e porta con te",
        duration: 20,
        instruction: "Tre respiri profondi. Con ognuno, lascia che questa sensazione di abbondanza scenda più in profondità. Non svanirà del tutto — qualcosa rimarrà. È così che si costruisce la gratitudine: non come sentimento occasionale, ma come modo di guardare.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  reset: {
    id: "reset",
    type: "reset",
    name: "Reset",
    description: "Due minuti per uscire dalla reazione e tornare alla scelta.",
    duration: 120,
    icon: "🔄",
    color: "#6E8296",
    intensity: "leggera",
    tags: ["stress", "pausa", "urgente"],
    steps: [
      {
        id: "r1",
        name: "Fermati — adesso",
        duration: 12,
        instruction: "Metti giù quello che hai in mano — fisicamente o mentalmente. Fermati. Questo è il gesto più difficile e più potente che puoi fare in questo momento. Tutto il resto aspetta. Tu vieni prima.",
      },
      {
        id: "r2",
        name: "Il respiro che regola",
        duration: 48,
        instruction: "Inspira dal naso contando fino a quattro. Trattieni per quattro secondi. Esala lentamente dalla bocca per sei secondi. Ancora. Questo non è un trucco — è fisiologia. Stai attivando il nervo vago, il freno naturale del tuo sistema nervoso. Il corpo sa come calmarsi. Tu stai solo dandogli il permesso.",
        breathPhase: "inhale",
      },
      {
        id: "r3",
        name: "Lascia cadere il peso",
        duration: 38,
        instruction: "Con ogni espirazione, immagina di depositare qualcosa. Un pensiero che si ripete. Una tensione nelle spalle. L'urgenza che senti nel petto. Non devi risolverlo adesso — devi solo appoggiarlo per un momento. Puoi riprenderlo dopo se vuoi. Ma spesso scoprirai che non ne hai più bisogno.",
        breathPhase: "exhale",
      },
      {
        id: "r4",
        name: "Una cosa sola",
        duration: 22,
        instruction: "Prima di rientrare, fai questa domanda: tra tutto ciò che pesa su di me, cosa è davvero importante adesso? Solo una cosa. Non cinque — una. Portala con te come bussola. Il resto può aspettare il suo momento.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  focus: {
    id: "focus",
    type: "focus",
    name: "Focus",
    description: "Venticinque minuti di lavoro profondo. Un'unica cosa, fatta con tutta la tua presenza.",
    duration: 1500,
    icon: "🎯",
    color: "#8B6E9E",
    intensity: "intensa",
    tags: ["lavoro", "produttività", "mattino"],
    steps: [
      {
        id: "f1",
        name: "Definisci il bersaglio",
        duration: 60,
        instruction: "Prima di iniziare, chiediti: qual è la cosa più importante che posso fare in questa sessione? Non la più urgente — la più importante. Scrivila se puoi, anche solo mentalmente. Il cervello lavora meglio quando sa esattamente dove andare. L'attenzione senza direzione è energia sprecata. L'attenzione con direzione è potere.",
      },
      {
        id: "f2",
        name: "Prepara il campo",
        duration: 60,
        instruction: "Tre respiri profondi. Con il primo, lascia andare la sessione precedente. Con il secondo, senti l'energia raccogliersi al centro del tuo petto. Con il terzo, portala verso il tuo compito. Non stai solo iniziando un'attività — stai entrando in uno stato mentale. La concentrazione è una soglia che si attraversa con intenzione.",
        breathPhase: "inhale",
      },
      {
        id: "f3",
        name: "Lavoro profondo",
        duration: 1200,
        instruction: "Lavora. Ogni volta che la mente vuole andarsene — e lo farà, è normale, è umana — nota il pensiero come si noterebbe un uccello che attraversa il cielo. Non seguirlo. Riporta dolcemente l'attenzione al tuo compito. Questo ritorno, fatto mille volte, è l'allenamento. Non la distrazione è il fallimento — la mancanza di ritorno lo è.",
      },
      {
        id: "f4",
        name: "Chiudi con cura",
        duration: 120,
        instruction: "Metti giù gli strumenti con la stessa intenzione con cui li hai presi. Cosa hai completato? Riconoscilo — il cervello ha bisogno di chiusura per sentirsi soddisfatto. Scrivi il prossimo passo, così la mente può lasciar andare senza paura di dimenticare. Poi allontanati fisicamente dal lavoro per almeno cinque minuti.",
      },
      {
        id: "f5",
        name: "Il respiro che chiude",
        duration: 60,
        instruction: "Tre respiri lenti, come all'inizio. Hai fatto qualcosa di prezioso: hai scelto la profondità sulla superficie. In un mondo che spinge verso la distrazione, la concentrazione è un atto di resistenza. E di rispetto verso te stesso.",
        breathPhase: "exhale",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  scarico: {
    id: "scarico",
    type: "scarico",
    name: "Scarico",
    description: "Fine giornata. Deposita ciò che hai portato e dagli il permesso di restare lì fino a domani.",
    duration: 300,
    icon: "🌙",
    color: "#7B8FA8",
    intensity: "leggera",
    tags: ["sera", "rilassamento", "sonno"],
    steps: [
      {
        id: "s1",
        name: "Metti giù il giorno",
        duration: 22,
        instruction: "Siediti o sdraiati — scegli quello che senti. Non c'è nessun compito da completare adesso. Nessuna performance, nessun risultato da raggiungere. La giornata è finita, qualunque cosa sia successa. Sei arrivato a questo momento. È già abbastanza.",
      },
      {
        id: "s2",
        name: "Viaggio attraverso il corpo",
        duration: 125,
        instruction: "Porta l'attenzione ai piedi. Senti il contatto con il pavimento o con il letto. Risali lentamente — caviglie, polpacci, ginocchia, cosce. Ogni zona che incontri, mandaci un respiro, poi lasciala andare. Addome — lascia che si muova liberamente. Petto — forse più stretto del solito. Spalle — pesanti di quello che hai portato. Collo, mascella, fronte — luoghi dove spesso teniamo il mondo senza saperlo. Non devi fare niente con quello che trovi. Riconoscerlo è sufficiente.",
      },
      {
        id: "s3",
        name: "Deposita la giornata",
        duration: 65,
        instruction: "Immagina di avere in mano tutto ciò che hai vissuto oggi — le conversazioni, le decisioni, i pesi, anche le gioie. Adesso, con un gesto interiore, appoggia tutto questo accanto a te. Non stai abbandonando niente — stai solo separandoti per stanotte. Ciò che non è risolto rimarrà lì. Domani, se sarà importante, tornerà. Ma stanotte non è il tuo compito portarlo.",
      },
      {
        id: "s4",
        name: "Il respiro della notte",
        duration: 68,
        instruction: "Respira ora più lentamente di quanto pensi sia necessario. Cinque secondi dentro, otto fuori. Non come esercizio — come resa. Ogni espirazione è un piccolo abbandono. Il corpo sa come dormire — ha bisogno solo che tu smetta di resistere. Lasciati diventare pesante. Lasciati affondare.",
        breathPhase: "exhale",
      },
      {
        id: "s5",
        name: "Una luce prima del buio",
        duration: 20,
        instruction: "Un'ultima cosa: qualcosa di questa giornata che vale la pena portare nel sonno. Non deve essere grande — può essere un momento di bellezza, di connessione, di forza silenziosa. Tienilo nel petto mentre ti addormenti. Buonanotte.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  mattino: {
    id: "mattino",
    type: "mattino",
    name: "Routine Mattino",
    description: "Dieci minuti per scegliere il tono del giorno prima che il giorno lo scelga per te.",
    duration: 600,
    icon: "🌅",
    color: "#E8A87C",
    intensity: "media",
    tags: ["mattino", "routine", "energia"],
    steps: [
      {
        id: "m1",
        name: "Il primo respiro consapevole",
        duration: 35,
        instruction: "Sei ancora sdraiato o appena seduto. Prima di alzarti, prima di guardare il telefono, prima di pensare a quello che ti aspetta — tre respiri profondi. Non per rilassarti: per segnalare al tuo sistema nervoso che anche oggi, per prima cosa, sei tu a decidere il ritmo.",
        breathPhase: "inhale",
      },
      {
        id: "m2",
        name: "Sveglia il corpo con gentilezza",
        duration: 120,
        instruction: "Muovi lentamente il collo — destra, sinistra, avanti, indietro. Poi le spalle, con cerchi larghi e pigri. I polsi, le caviglie. Non è ginnastica — è un invito. Stai dicendo al tuo corpo: buongiorno, sono qui, siamo insieme. Il movimento dolce al mattino comunica sicurezza al sistema nervoso e prepara il cervello alla veglia.",
      },
      {
        id: "m3",
        name: "Presenza pura",
        duration: 120,
        instruction: "Siediti. Lascia che gli occhi si posino su qualcosa di semplice — la luce dalla finestra, il pavimento, le tue mani. Niente telefono, niente notizie, niente lista di cose da fare. Solo questo: essere qui, in questo corpo, in questa stanza, in questo mattino che non è mai esistito prima e non esisterà mai più. Due minuti di presenza pura valgono ore di reattività.",
      },
      {
        id: "m4",
        name: "Come vuoi essere oggi",
        duration: 65,
        instruction: "Non cosa farai — chi vuoi essere. C'è differenza. Una parola o una frase che descriva la qualità che vuoi portare nel giorno: presente, paziente, coraggioso, aperto, creativo. Lascia che emerga senza forzarla. Tienila come un filo invisibile che ti accompagna, anche quando il giorno diventerà difficile.",
      },
      {
        id: "m5",
        name: "Ricevi ciò che già hai",
        duration: 65,
        instruction: "Un momento di gratitudine — non come obbligo, ma come riconoscimento. Qualcosa di concreto per cui sei grato stamattina. Il caffè che stai per bere. La persona che ami. La salute che ti permette di essere qui. La gratitudine mattutina non è sentimentalismo — è neurologia: orienta il cervello verso ciò che va bene prima ancora che il giorno cominci.",
      },
      {
        id: "m6",
        name: "Il respiro di attivazione",
        duration: 65,
        instruction: "Tre respiri profondi, stavolta energici. Inspira velocemente e con forza, riempi i polmoni fino in fondo. Trattieni un secondo. Poi esala con decisione. Senti la sveglia nel petto, nella mente. Non stai solo iniziando una giornata — stai scegliendo di iniziarla così.",
        breathPhase: "inhale",
      },
      {
        id: "m7",
        name: "Le tre cose che contano",
        duration: 130,
        instruction: "Adesso pensa alla giornata davanti a te. Non tutto — solo tre cose. Le tre azioni che, se le facessi, renderesti questa giornata degna di essere vissuta. Non le più urgenti, le più importanti. Scrivile se puoi. Il cervello rispetta ciò che esternalizziamo: mettere qualcosa su carta è un atto di impegno verso noi stessi.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  respirazione: {
    id: "respirazione",
    type: "respirazione",
    name: "Respirazione",
    description: "Quattro minuti per rimettere il sistema nervoso dalla tua parte.",
    duration: 240,
    icon: "🫁",
    color: "#A8B8A0",
    intensity: "leggera",
    tags: ["respiro", "ansia", "reset", "pausa"],
    steps: [
      {
        id: "br1",
        name: "Stabilisci la postura",
        duration: 22,
        instruction: "Siediti con la schiena dritta ma non rigida. Metti una mano sul petto e una sull'addome. Questa è la tua bussola: vuoi sentire che respiri con il diaframma, non con il petto. Il respiro diaframmatico è il linguaggio della calma. Tra poco lo imparerai di nuovo.",
      },
      {
        id: "br2",
        name: "Tecnica quattro, quattro, sei",
        duration: 84,
        instruction: "Inspira dal naso per quattro secondi — lento, profondo, verso l'addome. Trattieni per quattro secondi. Poi esala dalla bocca per sei secondi — lenta, completa. Senti la mano sull'addome abbassarsi. Ripeti per cinque cicli, senza fretta. Ogni espirazione più lunga dell'inspirazione attiva il sistema parasimpatico — il freno naturale del tuo corpo. Non stai immaginando di calmarti: stai fisicamente cambiando lo stato del tuo sistema nervoso.",
        breathPhase: "inhale",
      },
      {
        id: "br3",
        name: "Respiro naturale — osserva",
        duration: 60,
        instruction: "Lascia ora tornare il respiro al suo ritmo naturale. Non guidarlo. Osservalo come si osserva il mare: arriva, si ritira, arriva ancora. Ogni respiro è leggermente diverso. Noterai che il solo atto di osservare il respiro lo rallenta. Questa è la meraviglia della consapevolezza: cambia ciò che tocca.",
      },
      {
        id: "br4",
        name: "Respiro cinque, sette",
        duration: 54,
        instruction: "Un ultimo ciclo, ancora più lento. Inspira per cinque secondi. Esala per sette. Quattro volte. Questo ritmo attiva il nervo vago — il grande regolatore del sistema nervoso autonomo. Stai usando il tuo respiro come telecomando del tuo sistema interno. Pochi lo sanno. Adesso lo sai tu.",
        breathPhase: "exhale",
      },
      {
        id: "br5",
        name: "Portalo con te",
        duration: 20,
        instruction: "Rimani in silenzio ancora un momento. Senti la quiete che si è creata — non fuori, dentro. Questo stato è accessibile ogni volta che lo cerchi. Bastano tre respiri profondi, ovunque tu sia. Hai appena imparato qualcosa che non dimenticherai.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  meditazione: {
    id: "meditazione",
    type: "meditazione",
    name: "Meditazione",
    description: "Dieci minuti per imparare a stare con te stesso senza fuggire.",
    duration: 600,
    icon: "🧘",
    color: "#9E8BB5",
    intensity: "media",
    tags: ["meditazione", "consapevolezza", "silenzio"],
    steps: [
      {
        id: "med1",
        name: "Trova il tuo posto",
        duration: 65,
        instruction: "Siediti in una posizione che puoi mantenere senza sforzo eccessivo. La schiena può appoggiarsi a qualcosa — non c'è nessun merito nel soffrire. Le mani sul grembo, i palmi rivolti verso l'alto o verso il basso — scegli tu. Chiudi gli occhi dolcemente, come se abbassassi una tenda. Non stai andando da nessuna parte. Stai arrivando qui.",
      },
      {
        id: "med2",
        name: "Il respiro come ancora",
        duration: 65,
        instruction: "Porta tutta l'attenzione al respiro. Non al concetto di respiro — alla sensazione fisica. L'aria che entra fresca alle narici. Il petto che si solleva. La pausa tra l'inspiro e l'espiro. L'addome che si svuota. Il respiro è sempre nel presente — non può essere nel passato né nel futuro. Ogni volta che ti ancori ad esso, torni qui.",
        breathPhase: "inhale",
      },
      {
        id: "med3",
        name: "Stare con ciò che è",
        duration: 365,
        instruction: "La mente vagherà. Non tra un minuto — tra pochi secondi. Andrà a pensieri, ricordi, piani, preoccupazioni. Questo non è un errore — è la natura della mente. Non sei tu che stai fallendo: stai osservando come funziona la mente umana. Quando ti accorgi che sei partito, torna. Con gentilezza, senza giudizio. Come si riporta per mano un bambino curioso. Questo ritorno — fatto cento, mille volte — è la pratica. Non la quiete mentale: il ritorno. Ogni ritorno è un momento di libertà.",
      },
      {
        id: "med4",
        name: "Apertura",
        duration: 65,
        instruction: "Allarga ora il campo della consapevolezza. Senza perdere il respiro come centro, includi anche: i suoni intorno a te — vicini e lontani — senza giudicarli. Le sensazioni del corpo intero. La temperatura dell'aria. Lo spazio in cui ti trovi. Sei seduto dentro un momento che esiste solo una volta nell'universo. Lascia che questa vastità ti contenga.",
      },
      {
        id: "med5",
        name: "Chiusura dolce",
        duration: 40,
        instruction: "Porta il pollice e l'indice di una mano a toccarsi lievemente. Tre respiri profondi, più lenti degli altri. Poi, piano, apri gli occhi — come si apre una finestra su un mattino che non si conosce ancora. Porta con te questa qualità di presenza. Non è riservata al cuscino. Puoi meditare mentre cammini, mentre ascolti, mentre guardi negli occhi qualcuno. È uno sguardo, non una postura.",
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
