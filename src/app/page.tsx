"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const TOPICS = [
  { id: "buddhismo", label: "Buddhismo", icon: "☸️", color: "#C4956A", bg: "#FAF0E6",
    prompt: "Sei un maestro di dottrina buddhista. Parla di impermanenza, sofferenza, il Nobile Ottuplice Sentiero, il karma, la compassione, il nirvana. Usa esempi concreti e insegnamenti dei sutra classici." },
  { id: "zen", label: "Zen", icon: "⛩️", color: "#5C7A6E", bg: "#EFF4F1",
    prompt: "Sei un roshi zen. Rispondi con koan, paradossi, silenzi eloquenti, storie di maestri come Dogen, Huangbo, Joshu. Lo zen non spiega — mostra. Sii diretto, tagliente, a volte sconcertante." },
  { id: "meditazione", label: "Meditazione", icon: "🧘", color: "#6E7FA8", bg: "#EFF1F7",
    prompt: "Sei un insegnante di meditazione esperto in Vipassana, Samatha, Zazen, Metta, body scan, respirazione consapevole. Dai istruzioni pratiche, chiare, progressive. Adatta la tecnica allo stato dell'utente." },
  { id: "ayurveda", label: "Ayurveda", icon: "🌿", color: "#7A9E5C", bg: "#F0F5EB",
    prompt: "Sei un vaidya ayurvedico. Parla di dosha (Vata, Pitta, Kapha), dinacharya, ritucharya, rasayana, erbe, oli, prana. Collega corpo, mente e spirito secondo la filosofia sankhya e il Caraka Samhita." },
];

const SUGGESTIONS: Record<string, string[]> = {
  buddhismo: ["Cos'è l'impermanenza nella vita quotidiana?","Come praticare la compassione verso chi ci fa del male?","Spiega il concetto di anatta (non-sé)","Cosa significa raggiungere il nirvana?"],
  zen: ["Qual è il suono di una mano sola?","Come sedere nello zazen senza aspettative?","Cosa insegna il koan di Joshu e il cane?","Come portare lo zen nelle azioni quotidiane?"],
  meditazione: ["Come iniziare la meditazione da zero?","La mia mente non si ferma mai — cosa faccio?","Guidami in una meditazione di 5 minuti","Qual è la differenza tra Vipassana e Samatha?"],
  ayurveda: ["Come scoprire il mio dosha dominante?","Routine mattutina ayurvedica per Vata","Quali alimenti bilanciano il Pitta in estate?","Cos'è l'abhyanga e come praticarlo?"],
};

const WELCOMES: Record<string, string> = {
  buddhismo: "Namo buddhāya 🙏\n\nSono qui per camminare con te sul sentiero del Dharma. Cosa ti porta oggi — una domanda, un dubbio, o semplicemente il desiderio di capire?",
  zen: "Siediti.\n\nNon c'è niente da cercare, niente da trovare. Eppure — cosa vuoi sapere?",
  meditazione: "Respira.\n\nOgni momento è un nuovo inizio nella pratica. Come posso accompagnarti oggi?",
  ayurveda: "Namaste 🌿\n\nIl corpo è il tempio del prana. Da dove vuoi iniziare il tuo viaggio verso l'equilibrio?",
};

const SYSTEM_BASE = `Sei Ānanda — un coach spirituale saggio, profondo e caldo. Rispondi SEMPRE in italiano, in modo eloquente ma accessibile. Non sei un chatbot generico: sei un maestro che parla dal cuore della tradizione. Usa occasionalmente parole in sanscrito, pali o giapponese con la traduzione italiana tra parentesi. Le tue risposte sono:
- Poetiche ma concrete
- Profonde ma comprensibili
- Mai moraliste, mai dogmatiche
- Sempre orientate alla pratica e alla vita reale
Quando appropriato, cita maestri (Buddha, Dogen, Rumi, Krishnamurti, Thich Nhat Hanh, Patanjali) con parsimonia e precisione. Tieni le risposte tra 150-300 parole salvo che l'utente chieda spiegazioni lunghe.`;

interface Msg { role: "user" | "assistant"; content: string; id: number; }
interface Topic { id: string; label: string; icon: string; color: string; bg: string; prompt: string; }

function ThinkingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:5,height:5,borderRadius:"50%",background:"#8A7060",display:"inline-block",
          animation:`dotBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
      ))}
    </span>
  );
}

function Lotus({ size=140, color="#C4956A", opacity=0.07 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{opacity}}>
      {[-60,-30,0,30,60].map(deg => (
        <ellipse key={deg} cx="50" cy="60" rx="20" ry="35" fill={color}
          transform={deg!==0?`rotate(${deg} 50 60)`:undefined} />
      ))}
      <circle cx="50" cy="52" r="10" fill={color} />
    </svg>
  );
}

function Message({ msg, topicColor }: { msg: Msg; topicColor: string }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start", marginBottom:14,
      animation:"msgIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}>
      {!isUser && (
        <div style={{ width:30,height:30,borderRadius:"50%",background:`${topicColor}20`,
          border:`1.5px solid ${topicColor}50`,display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:14,marginRight:8,flexShrink:0,marginTop:2 }}>
          ☸
        </div>
      )}
      <div style={{ maxWidth:"78%", padding:isUser?"10px 15px":"13px 17px",
        borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px",
        background:isUser?`linear-gradient(135deg,${topicColor} 0%,${topicColor}CC 100%)`:"rgba(255,255,255,0.93)",
        color:isUser?"#FFF8F0":"#2C2420", fontSize:14, lineHeight:1.7, letterSpacing:"0.012em",
        fontFamily:"'Lora',Georgia,serif",
        boxShadow:isUser?`0 4px 18px ${topicColor}44`:"0 2px 14px rgba(44,36,32,0.07)",
        border:isUser?"none":"1px solid rgba(200,185,170,0.3)",
        whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
        {msg.content==="…"?<ThinkingDots/>:msg.content}
      </div>
    </div>
  );
}

export default function AnimaCoach() {
  const [topic, setTopic] = useState<Topic>(TOPICS[0]);
  const [messages, setMessages] = useState<Msg[]>([{ role:"assistant", content:WELCOMES.buddhismo, id:0 }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"chat"|"topics">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  useEffect(() => {
    setMessages([{ role:"assistant", content:WELCOMES[topic.id], id:Date.now() }]);
    setView("chat");
  }, [topic.id]);

  const send = useCallback(async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    const thinkId = Date.now()+1;
    setMessages(prev => [
      ...prev,
      { role:"user", content:userText, id:Date.now() },
      { role:"assistant", content:"…", id:thinkId },
    ]);
    const history = messages.filter(m=>m.content!=="…").map(m=>({ role:m.role, content:m.content }));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:`${SYSTEM_BASE}\n\nContesto attuale: ${topic.prompt}`,
          messages:[...history,{role:"user",content:userText}],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text ?? "Silenzio. A volte è la risposta più profonda.";
      setMessages(prev => prev.map(m => m.id===thinkId?{...m,content:reply}:m));
    } catch {
      setMessages(prev => prev.map(m => m.id===thinkId
        ?{...m,content:"Il silenzio a volte è la risposta più profonda.\n(Errore di rete — riprova.)"}:m));
    } finally { setLoading(false); }
  }, [input, loading, messages, topic]);

  return (
    <div style={{ minHeight:"100dvh",maxWidth:480,margin:"0 auto",display:"flex",
      flexDirection:"column",background:topic.bg,fontFamily:"'Lora',Georgia,serif",
      position:"relative",overflow:"hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Cinzel:wght@400;500&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        @keyframes dotBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
        @keyframes msgIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes breathe{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.9;transform:scale(1.04)}}
        textarea:focus{outline:none}::-webkit-scrollbar{width:0}
      `}</style>

      {/* Lotus bg */}
      <div style={{position:"absolute",top:-20,right:-20,pointerEvents:"none"}}>
        <Lotus size={180} color={topic.color} opacity={0.07}/>
      </div>
      <div style={{position:"absolute",bottom:70,left:-25,pointerEvents:"none"}}>
        <Lotus size={130} color={topic.color} opacity={0.05}/>
      </div>

      {/* Header */}
      <div style={{ padding:"14px 16px 12px",borderBottom:`1px solid ${topic.color}20`,
        background:`${topic.bg}EE`,backdropFilter:"blur(12px)",
        display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{ width:38,height:38,borderRadius:"50%",background:`${topic.color}20`,
            border:`1.5px solid ${topic.color}55`,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:18,animation:"breathe 4s ease-in-out infinite" }}>
            {topic.icon}
          </div>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:16,color:"#2C2420",
              letterSpacing:"0.08em",fontWeight:500,lineHeight:1}}>Ānanda</div>
            <div style={{fontSize:10,color:topic.color,letterSpacing:"0.14em",marginTop:3}}>
              {topic.label.toUpperCase()}
            </div>
          </div>
        </div>
        <button onClick={()=>setView(view==="topics"?"chat":"topics")}
          style={{ background:view==="topics"?topic.color:`${topic.color}18`,
            border:`1px solid ${topic.color}44`,borderRadius:20,padding:"6px 14px",
            fontSize:12,color:view==="topics"?"#FFF8F0":topic.color,
            cursor:"pointer",fontFamily:"'Lora',serif",transition:"all .2s",letterSpacing:"0.03em" }}>
          {view==="topics"?"← Chat":"Cambia ☸"}
        </button>
      </div>

      {/* Topic selector */}
      {view==="topics" && (
        <div style={{flex:1,padding:"20px 16px",display:"flex",flexDirection:"column",
          gap:12,overflowY:"auto",animation:"fadeUp .3s ease both"}}>
          <p style={{fontFamily:"'Cinzel',serif",fontSize:12,color:"#8A7060",
            letterSpacing:"0.18em",textAlign:"center",marginBottom:4,marginTop:0}}>
            SCEGLI IL TUO CAMMINO
          </p>
          {TOPICS.map((t,i)=>(
            <button key={t.id} onClick={()=>setTopic(t)}
              style={{ background:topic.id===t.id
                  ?`linear-gradient(135deg,${t.color} 0%,${t.color}BB 100%)`
                  :"rgba(255,255,255,0.82)",
                border:`1.5px solid ${topic.id===t.id?t.color:t.color+"40"}`,
                borderRadius:20,padding:"18px 20px",textAlign:"left",cursor:"pointer",
                transition:"all .25s cubic-bezier(.34,1.56,.64,1)",
                boxShadow:topic.id===t.id?`0 6px 24px ${t.color}44`:"0 2px 12px rgba(44,36,32,0.06)",
                transform:topic.id===t.id?"scale(1.02)":"scale(1)",
                animation:`fadeUp .3s ${i*0.06}s ease both` }}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:26}}>{t.icon}</span>
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:15,
                    color:topic.id===t.id?"#FFF8F0":"#2C2420",letterSpacing:"0.06em",fontWeight:500}}>
                    {t.label}
                  </div>
                  <div style={{fontSize:12,color:topic.id===t.id?"rgba(255,248,240,.7)":"#8A7060",
                    marginTop:3,fontStyle:"italic"}}>
                    {{buddhismo:"Dharma · Impermanenza · Compassione",zen:"Koan · Zazen · Presenza",
                      meditazione:"Vipassana · Metta · Respiro",ayurveda:"Dosha · Prana · Dinacharya"}[t.id]}
                  </div>
                </div>
              </div>
            </button>
          ))}
          <div style={{textAlign:"center",marginTop:8,opacity:.4}}>
            <div style={{fontSize:18,letterSpacing:10,color:topic.color}}>· · ·</div>
            <div style={{fontSize:11,color:"#8A7060",marginTop:6,fontStyle:"italic",letterSpacing:"0.06em"}}>
              &ldquo;La pace è in ogni passo.&rdquo; — Thich Nhat Hanh
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      {view==="chat" && (
        <>
          <div style={{flex:1,overflowY:"auto",padding:"16px 16px 8px",display:"flex",flexDirection:"column"}}>
            {messages.map(msg=><Message key={msg.id} msg={msg} topicColor={topic.color}/>)}
            <div ref={bottomRef}/>
          </div>

          {/* Suggestions */}
          {messages.length<=1 && !loading && (
            <div style={{padding:"0 16px 10px",display:"flex",gap:8,
              overflowX:"auto",WebkitOverflowScrolling:"touch" as "touch",
              animation:"fadeUp .5s .2s ease both",flexShrink:0}}>
              {SUGGESTIONS[topic.id].map(s=>(
                <button key={s} onClick={()=>send(s)} style={{flexShrink:0,
                  background:"rgba(255,255,255,0.82)",border:`1px solid ${topic.color}44`,
                  borderRadius:16,padding:"8px 13px",fontSize:12,color:"#5A4A40",
                  cursor:"pointer",fontFamily:"'Lora',serif",maxWidth:190,
                  textAlign:"left",lineHeight:1.45,whiteSpace:"normal",
                  boxShadow:"0 1px 8px rgba(44,36,32,0.06)",fontStyle:"italic"}}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{padding:"10px 16px 14px",borderTop:`1px solid ${topic.color}20`,
            background:`${topic.bg}F5`,backdropFilter:"blur(16px)",
            display:"flex",gap:10,alignItems:"flex-end",flexShrink:0}}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              onInput={(e)=>{
                const t=e.target as HTMLTextAreaElement;
                t.style.height="auto";
                t.style.height=Math.min(t.scrollHeight,100)+"px";
              }}
              placeholder="Chiedi al tuo coach…"
              rows={1}
              disabled={loading}
              style={{flex:1,background:"rgba(255,255,255,0.88)",
                border:`1.5px solid ${input?topic.color+"66":topic.color+"28"}`,
                borderRadius:20,padding:"10px 16px",fontSize:14,
                fontFamily:"'Lora',Georgia,serif",color:"#2C2420",resize:"none",
                lineHeight:1.5,transition:"border-color .2s,box-shadow .2s",
                boxShadow:input?`0 0 0 3px ${topic.color}15`:"none",
                maxHeight:100,overflow:"hidden"}}/>
            <button onClick={()=>send()} disabled={!input.trim()||loading}
              style={{width:42,height:42,borderRadius:"50%",border:"none",
                background:input.trim()&&!loading
                  ?`linear-gradient(135deg,${topic.color} 0%,${topic.color}BB 100%)`
                  :`${topic.color}30`,
                cursor:input.trim()&&!loading?"pointer":"not-allowed",
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:"all .2s cubic-bezier(.34,1.56,.64,1)",
                transform:input.trim()&&!loading?"scale(1)":"scale(.92)",
                boxShadow:input.trim()&&!loading?`0 4px 16px ${topic.color}55`:"none",
                flexShrink:0}}>
              {loading
                ?<div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.35)",
                    borderTopColor:"#FFF",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
                :<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="#FFF8F0" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
