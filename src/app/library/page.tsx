"use client";
import { useState } from "react";
import Link from "next/link";
import { getAllRoutines, formatDuration, cn } from "@/lib/utils";
import type { Routine } from "@/lib/types";
import BottomNav from "@/components/navigation/BottomNav";

const TAGS = ["Tutti", "mattino", "sera", "respiro", "focus", "stress", "pausa", "consapevolezza"];

export default function LibraryPage() {
  const [activeTag, setActiveTag] = useState("Tutti");
  const [expanded, setExpanded] = useState<string | null>(null);

  const all = getAllRoutines();
  const filtered =
    activeTag === "Tutti"
      ? all
      : all.filter((r) => r.tags.includes(activeTag));

  return (
    <div className="page-container overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-pratica-muted text-sm">Esplora</p>
        <h1 className="font-display text-3xl text-pratica-text mt-1">Libreria</h1>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              activeTag === tag
                ? "bg-pratica-green text-white"
                : "bg-pratica-warm text-pratica-muted"
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Routine cards */}
      <div className="px-4 space-y-3 pb-4">
        {filtered.map((routine, i) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            index={i}
            isExpanded={expanded === routine.id}
            onToggle={() => setExpanded(expanded === routine.id ? null : routine.id)}
          />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

function RoutineCard({
  routine,
  index,
  isExpanded,
  onToggle,
}: {
  routine: Routine;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const intensityColors = {
    leggera: { bg: "#A8B8A020", text: "#7A9970" },
    media: { bg: "#6E829620", text: "#4A6278" },
    intensa: { bg: "#8B6E9E20", text: "#6A4F7D" },
  };
  const ic = intensityColors[routine.intensity];

  return (
    <div
      className={`pratica-card overflow-hidden animate-fade-up stagger-${Math.min(index + 1, 6)}`}
      style={{ opacity: 0, animationFillMode: "forwards" }}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: `${routine.color}22` }}
        >
          {routine.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-display text-lg text-pratica-text">{routine.name}</h3>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
              style={{ background: ic.bg, color: ic.text }}
            >
              {routine.intensity}
            </span>
          </div>
          <p className="text-xs text-pratica-muted font-light line-clamp-2 leading-relaxed">
            {routine.description}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-pratica-muted">{formatDuration(routine.duration)}</span>
            <span className="text-pratica-border">·</span>
            <span className="text-xs text-pratica-muted">{routine.steps.length} step</span>
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8A8070"
          strokeWidth={2}
          strokeLinecap="round"
          className={cn("flex-shrink-0 transition-transform duration-300", isExpanded && "rotate-180")}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div
          className="px-4 pb-4 border-t border-pratica-border animate-fade-in"
          style={{ borderTopColor: `${routine.color}33` }}
        >
          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap pt-3 mb-4">
            {routine.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-pratica-muted bg-pratica-warm px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Steps */}
          <p className="text-xs text-pratica-muted uppercase tracking-widest mb-3">Sequenza</p>
          <div className="space-y-3 mb-4">
            {routine.steps.map((step, i) => (
              <div key={step.id} className="flex gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                  style={{ background: `${routine.color}33`, color: routine.color }}
                >
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-pratica-text">{step.name}</span>
                    <span className="text-xs text-pratica-muted">{formatDuration(step.duration)}</span>
                  </div>
                  <p className="text-xs text-pratica-muted font-light mt-0.5 leading-relaxed">
                    {step.instruction}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href={`/timer?routine=${routine.id}`}
            className="block w-full text-center py-3 rounded-xl text-sm font-medium text-white transition-all active:scale-98"
            style={{
              background: `linear-gradient(135deg, ${routine.color} 0%, ${routine.color}bb 100%)`,
            }}
          >
            Inizia {routine.name}
          </Link>
        </div>
      )}
    </div>
  );
}
