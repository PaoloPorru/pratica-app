"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",        icon: HomeIcon,    label: "Home"     },
  { href: "/timer",   icon: TimerIcon,   label: "Timer"    },
  { href: "/coach",   icon: CoachIcon,   label: "Ānanda"   },
  { href: "/diary",   icon: BookIcon,    label: "Diario"   },
  { href: "/progress",icon: ChartIcon,   label: "Progressi"},
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around h-[56px] px-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          const isCoach = href === "/coach";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200",
                isActive ? (isCoach ? "text-[#C4956A]" : "text-pratica-green-dark") : "text-pratica-muted"
              )}
            >
              <div className={cn(
                "w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-200",
                isActive
                  ? isCoach ? "bg-[#C4956A22]" : "bg-pratica-green-light"
                  : "bg-transparent"
              )}>
                <Icon size={isActive ? 22 : 20} />
              </div>
              <span className={cn(
                "text-[10px] font-medium tracking-wide transition-all",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function TimerIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function CoachIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M12 12c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z"/><path d="M12 2 L12 1 M8 3 L7 2 M16 3 L17 2" strokeWidth={1.4}/></svg>;
}
function BookIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}
function ChartIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
