'use client';

import { Flame } from 'lucide-react';

interface XPBarProps {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
  totalXp: number;
  title: string;
  color: string;
  streak: number;
  recentXp?: { label: string; xp: number }[];
}

export default function XPBar({
  level,
  currentLevelXp,
  nextLevelXp,
  progress,
  totalXp,
  title,
  color,
  streak,
  recentXp,
}: XPBarProps) {
  return (
    <div className="w-full mb-6">
      <style>{`
        @keyframes xpPillFloat {
          0% { opacity: 0; transform: translateY(0); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-24px); }
        }
        .xp-pill-animate {
          animation: xpPillFloat 2s ease-out forwards;
        }
      `}</style>

      {/* Level label */}
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">
        LEVEL {level} &middot; {title}
      </p>

      {/* Main bar row */}
      <div className="flex items-center gap-4">
        {/* Level badge */}
        <div
          className="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0"
          style={{ borderColor: color }}
        >
          <span className="font-mono text-sm font-bold" style={{ color }}>
            {level}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex-1 h-3 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: '#F4C430',
            }}
          />
        </div>

        {/* Right stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-mono text-xs font-bold">{totalXp.toLocaleString()} XP</span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-orange-500">
              <Flame className="w-3.5 h-3.5" />
              {streak}
            </span>
          )}
        </div>
      </div>

      {/* XP counts below bar */}
      <p className="font-mono text-[10px] text-black/40 mt-1 ml-14">
        {currentLevelXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
      </p>

      {/* Recent XP pill notifications */}
      {recentXp && recentXp.length > 0 && (
        <div className="relative flex flex-wrap gap-2 mt-2 ml-14">
          {recentXp.map((item, i) => (
            <span
              key={`${item.label}-${i}`}
              className="xp-pill-animate inline-flex items-center gap-1 bg-accent/20 border border-accent/40 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold text-accent"
              style={{ animationDelay: `${i * 300}ms` }}
            >
              +{item.xp} {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
