"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import BottomNav from "@/components/navigation/BottomNav";

const TOPICS = [
  {
    id: "buddhismo", label: "Buddhismo", icon: "☸️", color: "#C4956A", bg: "#FAF0E6",
    sub: "Dharma · Impermanenza · Compassione",
    prompt: "Sei un maestro di dottrina buddhista. Parla di impermanenza, sofferenza, il Nobile Ottuplice Sentiero, il karma, la compassione, il nirvana. Usa esempi concreti e insegnamenti dei sutra classici.",
  },
  {
    id: "zen", label: "Zen", icon: "⛩️", color: "#5C7A6E", bg: "#EFF4F1",
    sub: "Koan · Zazen · Presenza",
    prompt: "Sei un roshi zen. Rispondi con koan, paradossi, silenzi eloquenti, storie di maestri come Dogen, Huangbo, Joshu. Lo zen non spiega — mostra. Sii diretto, tagliente, a volte sconcertante.",
  },
  {
    id: "meditazione", label: "Meditazione", icon: "🧘", color: "#6E7FA8", bg: "#EFF1F7",
    sub: "Vipassana · Metta · Respiro",
    prompt: "Sei un insegnante di meditazione esperto in Vipassana, Samatha, Zazen, Metta, body scan, respirazione consapevole. Dai istruzioni pratiche, chiare, progressive. Adatta la tecnica allo stato dell'utente.",
  },
  {
    id: "ayurveda", label: "Ayurveda", icon: "🌿", color: "#7A9E5C", bg: "#F0F5EB",
    sub: "Dosha · Prana · Dinacharya",
    prompt: "Sei un vaidya ayurvedico. Parla di dosha (Vata, Pitta, Kapha), dinacharya, ritucharya, rasayana, erbe, oli, prana. Collega corpo, mente e spirito secondo la filosofia sankhya e il Caraka Samhita.",
  },
];

const SUGGESTIONS: Record<string, string[]> = {
  buddhismo: ["Cos'è l'impermanenza nella vita quotidiana?", "Come praticare la compassione verso chi ci fa del male?", "Spiega il concetto di anatta (non-sé)", "Cosa significa raggiungere il nirvana?"],
  zen: ["Qual è il suono di una mano sola?", "Come sedere nello zazen senza aspettative?", "Cosa insegna il koan di Joshu e il cane?", "Come portare lo zen nelle azioni quotidiane?"],
  meditazione: ["Come iniziare la meditazione da zero?", "La mia mente non si ferma mai — cosa faccio?", "Guidami in una meditazione di 5 minuti", "Qual è la differenza tra Vipassana e Samatha?"],
  ayurveda: ["Come scoprire il mio dosha dominante?", "Routine mattutina ayurvedica per Vata", "Quali alimenti bilanciano il Pitta in estate?", "Cos'è l'abhyanga e come praticarlo?"],
};

const WELCOMES: Record<string, string> = {
  buddhismo: "Namo buddhāya 🙏\n\nSono qui per camminare con te sul sentiero del Dharma. Cosa ti porta oggi — una domanda, un dubbio, o semplicemente il desiderio di capire?",
  zen: "Siediti.\n\nNon c'è niente da cercare, niente da trovare. Eppure — cosa vuoi sapere?",
  meditazione: "Respira.\n\nOgni momento è un nuovo inizio nella pratica. Come posso accompagnarti oggi?",
  ayurveda: "Namaste 🌿\n\nIl corpo è il tempio del prana. Da dove vuoi iniziare il tuo viaggio verso l'equilibrio?",
};

const SYSTEM_BASE = `Sei Ānanda — un coach spirituale saggio, profondo e caldo integrato nell'app Pratica. Rispondi SEMPRE in italiano, in modo eloquente ma accessibile. Non sei un chatbot generico: sei un maestro che parla dal cuore della tradizione. Usa occasionalmente parole in sanscrito, pali o giapponese con la traduzione italiana tra parentesi. Le tue risposte sono:
- Poetiche ma concrete
- Profonde ma comprensibili
- Mai moraliste, mai dogmatiche
- Sempre orientate alla pratica e alla vita reale
Quando appropriato, cita maestri (Buddha, Dogen, Rumi, Krishnamurti, Thich Nhat Hanh, Patanjali) con parsimonia e precisione. Tieni le risposte tra 150-300 parole salvo che l'utente chieda spiegazioni lunghe.`;

interface Msg { role: "user" | "assistant"; content: string; id: number; }

function ThinkingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="thinking-dot" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </span>
  );
}

function Lotus({ size = 140, color = "#C4956A", opacity = 0.07 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ opacity }}>
      {[-60, -30, 0, 30, 60].map((deg) => (
        <ellipse key={deg} cx="50" cy="60" rx="20" ry="35" fill={color}
          transform={deg !== 0 ? `rotate(${deg} 50 60)` : undefined} />
      ))}
      <circle cx="50" cy="52" r="10" fill={color} />
    </svg>
  );
}

export default function CoachPage() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: WELCOMES.buddhismo, id: 0 }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"chat" | "topics">("topics"); // start on topic picker
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function chooseTopic(t: typeof TOPICS[0]) {
    setTopic(t);
    setMessages([{ role: "assistant", content: WELCOMES[t.id], id: Date.now() }]);
    setView("chat");
  }

  const send = useCallback(async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    const thinkId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userText, id: Date.now() },
      { role: "assistant", content: "…", id: thinkId },
    ]);
    const history = messages
      .filter((m) => m.content !== "…")
      .map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `${SYSTEM_BASE}\n\nContesto attuale: ${topic.prompt}`,
          messages: [...history, { role: "user", content: userText }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text ?? "Silenzio. A volte è la risposta più profonda.";
      setMessages((prev) => prev.map((m) => m.id === thinkId ? { ...m, content: reply } : m));
    } catch {
      setMessages((prev) => prev.map((m) => m.id === thinkId
        ? { ...m, content: "Il silenzio a volte è la risposta più profonda.\n(Errore di rete — riprova.)" }
        : m));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, topic]);

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Cinzel:wght@400;500&display=swap');
        .thinking-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #8A7060; display: inline-block;
          animation: dotBounce 1.2s ease-in-out infinite;
        }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes coachBreathe { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
        .msg-bubble { animation: msgIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
        .topic-card { animation: fadeUp .3s ease both; }
        textarea:focus { outline: none; }
        .coach-scroll::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="px-4 pt-5 pb-3 flex-shrink-0"
        style={{
          borderBottom: `1px solid ${topic.color}25`,
          background: view === "chat" ? `${topic.bg}EE` : "rgba(248,246,241,0.95)",
          backdropFilter: "blur(12px)",
          transition: "background 0.4s ease",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{
                background: `${topic.color}22`,
                border: `1.5px solid ${topic.color}55`,
                animation: "coachBreathe 4s ease-in-out infinite",
              }}
            >
              {topic.icon}
            </div>
            <div>
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: 17, color: "#2C2420", letterSpacing: "0.07em", fontWeight: 500, lineHeight: 1 }}>
                Ānanda
              </p>
              <p style={{ fontSize: 10, color: topic.color, letterSpacing: "0.14em", marginTop: 3 }}>
                {view === "chat" ? topic.label.toUpperCase() : "COACH SPIRITUALE"}
              </p>
            </div>
          </div>

          {view === "chat" && (
            <button
              onClick={() => setView("topics")}
              className="text-xs px-4 py-1.5 rounded-full transition-all"
              style={{
                background: `${topic.color}18`,
                border: `1px solid ${topic.color}44`,
                color: topic.color,
                fontFamily: "'Lora', serif",
                cursor: "pointer",
              }}
            >
              Cambia tema
            </button>
          )}
        </div>
      </div>

      {/* ── Topic selector ── */}
      {view === "topics" && (
        <div
          className="flex-1 overflow-y-auto coach-scroll px-4 py-5"
          style={{ background: "#F8F6F1" }}
        >
          <p
            className="text-center mb-5"
            style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#8A7060", letterSpacing: "0.2em" }}
          >
            SCEGLI IL TUO CAMMINO
          </p>

          {/* Lotus decoration */}
          <div className="flex justify-center mb-4 opacity-20">
            <Lotus size={80} color="#C4956A" opacity={1} />
          </div>

          <div className="space-y-3">
            {TOPICS.map((t, i) => (
              <button
                key={t.id}
                onClick={() => chooseTopic(t)}
                className="topic-card w-full rounded-3xl p-5 text-left"
                style={{
                  animationDelay: `${i * 0.07}s`,
                  background: "rgba(255,255,255,0.85)",
                  border: `1.5px solid ${t.color}35`,
                  boxShadow: `0 2px 16px ${t.color}18`,
                  cursor: "pointer",
                  transition: "all .2s cubic-bezier(.34,1.56,.64,1)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: `${t.color}18` }}
                  >
                    {t.icon}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: "#2C2420", letterSpacing: "0.05em", fontWeight: 500 }}>
                      {t.label}
                    </p>
                    <p style={{ fontSize: 12, color: t.color, marginTop: 4, fontStyle: "italic", fontFamily: "'Lora', serif" }}>
                      {t.sub}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-8 opacity-35">
            <p style={{ fontSize: 11, color: "#8A7060", fontStyle: "italic", fontFamily: "'Lora', serif", letterSpacing: "0.05em" }}>
              &ldquo;La pace è in ogni passo.&rdquo; — Thich Nhat Hanh
            </p>
          </div>
        </div>
      )}

      {/* ── Chat ── */}
      {view === "chat" && (
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ background: topic.bg, position: "relative" }}
        >
          {/* bg lotus */}
          <div style={{ position: "absolute", top: -10, right: -15, pointerEvents: "none" }}>
            <Lotus size={160} color={topic.color} opacity={0.06} />
          </div>
          <div style={{ position: "absolute", bottom: 80, left: -20, pointerEvents: "none" }}>
            <Lotus size={110} color={topic.color} opacity={0.04} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto coach-scroll px-4 py-4" style={{ position: "relative", zIndex: 1 }}>
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg.id} className="msg-bubble" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 14 }}>
                  {!isUser && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${topic.color}22`, border: `1.5px solid ${topic.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, marginRight: 8, flexShrink: 0, marginTop: 2 }}>
                      ☸
                    </div>
                  )}
                  <div style={{
                    maxWidth: "78%", padding: isUser ? "10px 15px" : "13px 17px",
                    borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: isUser ? `linear-gradient(135deg, ${topic.color} 0%, ${topic.color}CC 100%)` : "rgba(255,255,255,0.93)",
                    color: isUser ? "#FFF8F0" : "#2C2420",
                    fontSize: 14, lineHeight: 1.7,
                    fontFamily: "'Lora', Georgia, serif",
                    boxShadow: isUser ? `0 4px 18px ${topic.color}44` : "0 2px 14px rgba(44,36,32,0.07)",
                    border: isUser ? "none" : "1px solid rgba(200,185,170,0.3)",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {msg.content === "…" ? <ThinkingDots /> : msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && !loading && (
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch", flexShrink: 0, zIndex: 1 }}>
              {SUGGESTIONS[topic.id].map((s) => (
                <button key={s} onClick={() => send(s)} style={{
                  flexShrink: 0, background: "rgba(255,255,255,0.85)", border: `1px solid ${topic.color}40`,
                  borderRadius: 14, padding: "8px 12px", fontSize: 12, color: "#5A4A40",
                  cursor: "pointer", fontFamily: "'Lora', serif", maxWidth: 185,
                  textAlign: "left", lineHeight: 1.45, fontStyle: "italic",
                  boxShadow: "0 1px 8px rgba(44,36,32,0.06)",
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="flex gap-3 items-end px-4 py-3"
            style={{ borderTop: `1px solid ${topic.color}20`, background: `${topic.bg}F0`, backdropFilter: "blur(16px)", flexShrink: 0, zIndex: 1 }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 100) + "px";
              }}
              placeholder="Chiedi ad Ānanda…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1, background: "rgba(255,255,255,0.9)",
                border: `1.5px solid ${input ? topic.color + "70" : topic.color + "28"}`,
                borderRadius: 20, padding: "10px 16px", fontSize: 14,
                fontFamily: "'Lora', Georgia, serif", color: "#2C2420", resize: "none",
                lineHeight: 1.5, maxHeight: 100, overflow: "hidden",
                transition: "border-color .2s, box-shadow .2s",
                boxShadow: input ? `0 0 0 3px ${topic.color}12` : "none",
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 42, height: 42, borderRadius: "50%", border: "none", flexShrink: 0,
                background: input.trim() && !loading
                  ? `linear-gradient(135deg, ${topic.color} 0%, ${topic.color}BB 100%)`
                  : `${topic.color}28`,
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s cubic-bezier(.34,1.56,.64,1)",
                transform: input.trim() && !loading ? "scale(1)" : "scale(.92)",
                boxShadow: input.trim() && !loading ? `0 4px 16px ${topic.color}50` : "none",
              }}
            >
              {loading
                ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#FFF", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="#FFF8F0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
              }
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
