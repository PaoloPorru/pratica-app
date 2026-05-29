// ─────────────────────────────────────────────────────────────────
// PRATICA WIDGET per Scriptable
// 
// SETUP:
// 1. Installa Scriptable dall'App Store (gratis)
// 2. Apri Scriptable → "+" → incolla questo script → salva come "PraticaWidget"
// 3. In Pratica app, tocca "Sincronizza Widget" per inviare i dati
// 4. Tieni premuto sulla Home → "+" → cerca Scriptable → aggiungi widget
// ─────────────────────────────────────────────────────────────────

const FM = FileManager.iCloud();
const DATA_PATH = FM.joinPath(FM.documentsDirectory(), "pratica-data.json");

const COLORS = {
  bg:         new Color("#F8F6F1"),
  bgDark:     new Color("#EDE8DF"),
  green:      new Color("#A8B8A0"),
  greenDark:  new Color("#7A9970"),
  blue:       new Color("#6E8296"),
  warm:       new Color("#C4956A"),
  text:       new Color("#2C2420"),
  muted:      new Color("#8A7060"),
  border:     new Color("#E0D8CC"),
  white:      new Color("#FFFFFF"),
  card:       new Color("#FFFFFFDD"),
};

// ── Dati di default ─────────────────────────────────────────────
let data = {
  streak: 0,
  longestStreak: 0,
  totalMinutes: 0,
  todayDone: 0,
  todayMood: null,
  energy: 3,
  routineName: "Centratura",
  routineIcon: "🌿",
  routineType: "centratura",
  coachMessage: "Inizia la tua pratica quotidiana.",
  lastSync: null,
};

// ── Se lanciato da URL scheme (Sincronizza Widget) ───────────────
if (args.queryParameters && args.queryParameters.data) {
  try {
    const decoded = Data.fromBase64String(args.queryParameters.data);
    const parsed = JSON.parse(decoded.toRawString());
    data = { ...data, ...parsed, lastSync: new Date().toISOString() };
    FM.writeString(DATA_PATH, JSON.stringify(data));
    
    const alert = new Alert();
    alert.title = "🌿 Widget aggiornato";
    alert.message = `Streak: ${data.streak} giorni · ${data.totalMinutes} min totali`;
    alert.addAction("Ottimo!");
    await alert.present();
  } catch(e) {
    const alert = new Alert();
    alert.title = "Errore";
    alert.message = "Riprova dalla app Pratica.";
    alert.addAction("OK");
    await alert.present();
  }
  Script.complete();
  return;
}

// ── Leggi dati salvati ───────────────────────────────────────────
if (FM.fileExists(DATA_PATH)) {
  try {
    if (FM.isFileStoredIniCloud(DATA_PATH) && !FM.isFileDownloaded(DATA_PATH)) {
      await FM.downloadFileFromiCloud(DATA_PATH);
    }
    const saved = JSON.parse(FM.readString(DATA_PATH));
    data = { ...data, ...saved };
  } catch(e) {}
}

// ── Helpers ──────────────────────────────────────────────────────
function moodEmoji(mood) {
  return ["😔","😕","😐","🙂","😊"][mood - 1] || "🌅";
}
function energyColor(e) {
  return [new Color("#EF9999"), new Color("#F5C87A"), new Color("#F5E07A"),
          COLORS.green, COLORS.greenDark][e - 1] || COLORS.green;
}
function formatTime(iso) {
  if (!iso) return "mai";
  const d = new Date(iso);
  const now = new Date();
  const diffM = Math.floor((now - d) / 60000);
  if (diffM < 60) return `${diffM}m fa`;
  if (diffM < 1440) return `${Math.floor(diffM/60)}h fa`;
  return d.toLocaleDateString("it-IT", { day:"numeric", month:"short" });
}

// ── Widget SMALL ─────────────────────────────────────────────────
function buildSmall(w) {
  w.backgroundGradient = makeGradient(COLORS.bg, COLORS.bgDark);
  w.setPadding(14, 14, 14, 14);
  w.url = "https://pratica-app-ten.vercel.app";

  // Top: icon + nome
  const top = w.addStack();
  top.layoutHorizontally();
  top.centerAlignContent();
  const iconTxt = top.addText("🌿");
  iconTxt.font = Font.systemFont(14);
  top.addSpacer(4);
  const nameTxt = top.addText("Pratica");
  nameTxt.font = Font.boldSystemFont(13);
  nameTxt.textColor = COLORS.greenDark;

  w.addSpacer(10);

  // Streak
  const streakNum = w.addText(String(data.streak));
  streakNum.font = Font.boldRoundedSystemFont(44);
  streakNum.textColor = COLORS.greenDark;
  const streakLabel = w.addText(data.streak === 1 ? "giorno" : "giorni di fila");
  streakLabel.font = Font.systemFont(11);
  streakLabel.textColor = COLORS.muted;

  w.addSpacer(6);

  // Mood + energy row
  const row = w.addStack();
  row.layoutHorizontally();
  if (data.todayMood) {
    const moodTxt = row.addText(moodEmoji(data.todayMood));
    moodTxt.font = Font.systemFont(16);
  }
  row.addSpacer(4);
  const doneTxt = row.addText(data.todayDone > 0 ? `${data.todayDone} ✓` : "0 pratiche");
  doneTxt.font = Font.systemFont(11);
  doneTxt.textColor = data.todayDone > 0 ? COLORS.greenDark : COLORS.muted;
}

// ── Widget MEDIUM ────────────────────────────────────────────────
function buildMedium(w) {
  w.backgroundGradient = makeGradient(COLORS.bg, COLORS.bgDark);
  w.setPadding(16, 16, 16, 16);
  w.url = "https://pratica-app-ten.vercel.app";

  // Header
  const header = w.addStack();
  header.layoutHorizontally();
  header.centerAlignContent();
  const logoTxt = header.addText("🌿 Pratica");
  logoTxt.font = Font.boldSystemFont(14);
  logoTxt.textColor = COLORS.greenDark;
  header.addSpacer();
  if (data.lastSync) {
    const syncTxt = header.addText(formatTime(data.lastSync));
    syncTxt.font = Font.systemFont(10);
    syncTxt.textColor = COLORS.muted;
  }

  w.addSpacer(10);

  // Main row: streak | energy | mood
  const mainRow = w.addStack();
  mainRow.layoutHorizontally();
  mainRow.spacing = 10;

  // Streak card
  const streakCard = mainRow.addStack();
  streakCard.layoutVertically();
  streakCard.backgroundColor = COLORS.card;
  streakCard.cornerRadius = 12;
  streakCard.setPadding(10, 12, 10, 12);
  const sNum = streakCard.addText(String(data.streak));
  sNum.font = Font.boldRoundedSystemFont(32);
  sNum.textColor = COLORS.greenDark;
  const sLabel = streakCard.addText(data.streak === 1 ? "giorno" : "giorni");
  sLabel.font = Font.systemFont(10);
  sLabel.textColor = COLORS.muted;
  const sMin = streakCard.addText(`${data.totalMinutes} min`);
  sMin.font = Font.systemFont(9);
  sMin.textColor = COLORS.muted;

  // Energy + mood card
  const rightCol = mainRow.addStack();
  rightCol.layoutVertically();
  rightCol.spacing = 8;

  // Energy
  const energyCard = rightCol.addStack();
  energyCard.layoutHorizontally();
  energyCard.centerAlignContent();
  energyCard.backgroundColor = COLORS.card;
  energyCard.cornerRadius = 10;
  energyCard.setPadding(8, 10, 8, 10);
  energyCard.spacing = 4;
  for (let i = 0; i < 5; i++) {
    const bar = energyCard.addStack();
    bar.backgroundColor = i < data.energy ? energyColor(data.energy) : COLORS.border;
    bar.cornerRadius = 2;
    bar.size = new Size(5, 14 + i * 3);
  }
  energyCard.addSpacer(6);
  const eLevels = ["Esausto","Stanco","Ok","Energico","Al top"];
  const eLabel = energyCard.addText(eLevels[data.energy - 1] || "Ok");
  eLabel.font = Font.systemFont(11);
  eLabel.textColor = COLORS.text;

  // Mood
  const moodCard = rightCol.addStack();
  moodCard.layoutHorizontally();
  moodCard.centerAlignContent();
  moodCard.backgroundColor = COLORS.card;
  moodCard.cornerRadius = 10;
  moodCard.setPadding(8, 10, 8, 10);
  moodCard.spacing = 6;
  const moodEmojiTxt = moodCard.addText(data.todayMood ? moodEmoji(data.todayMood) : "🌅");
  moodEmojiTxt.font = Font.systemFont(18);
  const moodLabels = ["Pesante","Difficile","Neutro","Bene","Ottimo"];
  const moodLabel = moodCard.addText(data.todayMood ? moodLabels[data.todayMood - 1] : "Non registrato");
  moodLabel.font = Font.systemFont(11);
  moodLabel.textColor = COLORS.text;
  moodCard.addSpacer();

  w.addSpacer(8);

  // Coach message
  const msgStack = w.addStack();
  msgStack.backgroundColor = new Color("#A8B8A020");
  msgStack.cornerRadius = 10;
  msgStack.setPadding(8, 12, 8, 12);
  msgStack.layoutHorizontally();
  const iconT = msgStack.addText(data.routineIcon || "🌿");
  iconT.font = Font.systemFont(14);
  msgStack.addSpacer(6);
  const msgTxt = msgStack.addText(`"${data.coachMessage}"`);
  msgTxt.font = Font.italicSystemFont(11);
  msgTxt.textColor = COLORS.muted;
  msgTxt.lineLimit = 2;
}

// ── Widget LARGE ─────────────────────────────────────────────────
function buildLarge(w) {
  buildMedium(w); // estende medium con più dettagli
  // Potresti aggiungere un calendario streak qui
}

// ── Gradient helper ──────────────────────────────────────────────
function makeGradient(c1, c2) {
  const g = new LinearGradient();
  g.colors = [c1, c2];
  g.locations = [0, 1];
  g.startPoint = new Point(0, 0);
  g.endPoint = new Point(1, 1);
  return g;
}

// ── Render ───────────────────────────────────────────────────────
const widget = new ListWidget();
widget.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000); // aggiorna ogni 30 min

const size = config.widgetFamily;

if (size === "small") {
  buildSmall(widget);
} else if (size === "large") {
  buildLarge(widget);
} else {
  buildMedium(widget); // default medium
}

if (!config.runInWidget) {
  // Preview in app
  await widget.presentMedium();
}

Script.setWidget(widget);
Script.complete();
