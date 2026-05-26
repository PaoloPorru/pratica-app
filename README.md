# 🌿 Pratica

**Il tuo coach di pratica quotidiana.**  
Consapevolezza · Disciplina · Focus

---

## ✨ Overview

Pratica è una **PWA installabile su iPhone** (e Android) che funge da coach personale per la pratica quotidiana. Nessun abbonamento, nessun account, nessun dato nel cloud — funziona completamente offline sul tuo dispositivo.

**Stack:** Next.js 15 · TypeScript · TailwindCSS · PWA · localStorage  
**Hosting:** Vercel Free / Cloudflare Pages Free  
**AI:** Motore euristico interno (+ supporto opzionale Ollama/Llama3/Mistral/Gemma)  
**Costo:** €0

---

## 🚀 Quick Start

```bash
# 1. Installa le dipendenze
npm install

# 2. Genera le icone PWA
npm run generate-icons

# 3. Copia env
cp .env.example .env.local

# 4. Avvia in development
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

## 📱 Installazione su iPhone

1. Apri l'app in **Safari** su iPhone
2. Tocca il pulsante **Condividi** (rettangolo con freccia in su)
3. Scorri verso il basso e tocca **"Aggiungi alla schermata Home"**
4. Rinomina se vuoi → tocca **Aggiungi**

L'app si apre come app nativa, a tutto schermo, senza barra del browser.

---

## 🏗 Struttura Progetto

```
pratica/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── apple-touch-icon.png   # Icona iPhone
│   └── icons/                 # Icone PWA (generate da npm run generate-icons)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout con meta PWA
│   │   ├── page.tsx           # 🏠 Home dinamica
│   │   ├── onboarding/        # 📝 Onboarding 5 step
│   │   ├── timer/             # ⏱ Timer immersivo
│   │   ├── diary/             # 📓 Diario + mood
│   │   ├── progress/          # 📊 Progressi + grafici
│   │   └── library/           # 📚 Libreria routine
│   │
│   ├── components/
│   │   └── navigation/
│   │       └── BottomNav.tsx  # Navigazione bottom
│   │
│   ├── lib/
│   │   ├── types.ts           # TypeScript types
│   │   ├── storage.ts         # localStorage + IndexedDB stub
│   │   ├── recommendationEngine.ts  # 🧠 Coach adattivo
│   │   └── utils.ts           # Utilities + libreria routine
│   │
│   └── hooks/
│       └── useLocalStorage.ts # React hook storage
│
├── scripts/
│   └── generate-icons.js      # Genera icone PNG
│
├── next.config.ts             # Next.js + PWA config
├── tailwind.config.ts         # Design system
├── vercel.json                # Deploy config
└── .env.example               # Template variabili
```

---

## 🧠 Coach Adattivo (Motore Euristico)

Il `recommendationEngine.ts` implementa logiche adattive senza alcuna API:

| Condizione | Azione |
|---|---|
| Pratica saltata ≥ 2 giorni | Riduci intensità, suggerisci respiro |
| Streak ≥ 7 giorni | Aumenta durata del 10% |
| Streak ≥ 30 giorni | Aumenta durata del 25% |
| Stress alto (≥ 4/5) | Suggerisci Reset immediato |
| Energia bassa | Proponi pratica leggera |
| Ora mattino (< 9:00) | Centratura o Mattino |
| Ora sera (> 20:00) | Scarico |
| Umore basso (≤ 2/5) | Reset + messaggio compassionevole |

### Supporto AI locale (opzionale)

```env
# .env.local
NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
NEXT_PUBLIC_OLLAMA_MODEL=llama3
```

Installa Ollama: https://ollama.ai  
Modelli supportati: `llama3`, `mistral`, `gemma`, `phi3`

Se Ollama non risponde (timeout 5s), il motore euristico prende il controllo automaticamente.

---

## 📚 Libreria Routine

| Routine | Durata | Intensità | Tag |
|---|---|---|---|
| 🌿 Centratura | 5 min | Leggera | mattino, consapevolezza |
| ✨ Gratitudine | 3 min | Leggera | sera, umore |
| 🔄 Reset | 2 min | Leggera | stress, urgente |
| 🎯 Focus | 25 min | Intensa | lavoro, produttività |
| 🌙 Scarico | 5 min | Leggera | sera, sonno |
| 🌅 Routine Mattino | 10 min | Media | mattino, routine |
| 🫁 Respirazione | 4 min | Leggera | respiro, ansia |
| 🧘 Meditazione | 10 min | Media | silenzio, consapevolezza |

---

## 🌐 Deploy

### Vercel (Raccomandato)

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel deploy

# Production
vercel --prod
```

**Oppure:** Collega il repo GitHub a [vercel.com](https://vercel.com) → deploy automatico ad ogni push.

### Cloudflare Pages

```bash
npm run build
# Upload della cartella .next/static su Cloudflare Pages
# Oppure collega repo GitHub direttamente
```

---

## 🎨 Design System

```
Sfondo:      #F8F6F1  (carta calda)
Verde:       #A8B8A0  (salvia)
Verde scuro: #7A9970  (foglia)
Blu:         #6E8296  (ardesia)
Testo:       #2C2C2C
Muted:       #8A8070

Font display: Playfair Display (Google Fonts, open source)
Font body:    Plus Jakarta Sans (Google Fonts, open source)
```

---

## ✅ Checklist

- [x] Gira in locale (`npm run dev`)
- [x] Installabile su iPhone (Safari → Condividi → Aggiungi a Home)
- [x] Funziona offline (Service Worker via next-pwa)
- [x] 100% gratuito
- [x] 100% open source
- [x] Zero dipendenze obbligatorie proprietarie
- [x] PWA manifest completo
- [x] Apple Touch Icon
- [x] Safe areas iPhone (notch + home bar)
- [x] Onboarding 5 step
- [x] Home dinamica con energia + streak + coach
- [x] Timer immersivo con animazione respirazione
- [x] Diario con mood tracking
- [x] Progressi con grafici (Recharts)
- [x] Libreria 8 routine complete
- [x] Coach adattivo euristico
- [x] Supporto Ollama opzionale
- [x] IndexedDB predisposto per migrazione futura
- [x] Deploy Vercel configurato

---

## 🔒 Privacy

Tutti i dati rimangono sul dispositivo in `localStorage`.  
Nessun dato viene inviato a server esterni (salvo se configuri Supabase in `.env.local`).

---

## 📄 License

MIT — fai quello che vuoi, ma pratica ogni giorno. 🌿
