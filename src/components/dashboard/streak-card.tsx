"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy, Zap } from "lucide-react";
import type { StreakInfo } from "@/lib/types";
import { useAnimatedNumber } from "@/hooks/use-animated-number";

function AnimatedValue({ value, className }: { value: number; className?: string }) {
  const animated = useAnimatedNumber(value);
  return <p className={className}>{animated}</p>;
}

interface StreakCardsProps {
  streak: StreakInfo;
}

export function StreakCards({ streak }: StreakCardsProps) {
  const cards = [
    {
      title: "Today",
      value: streak.todayCount,
      subtitle: "contributions",
      icon: Zap,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Current Streak",
      value: streak.current,
      subtitle: "days",
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Longest Streak",
      value: streak.longest,
      subtitle: "days",
      icon: Trophy,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card, i) => (
        <Card key={card.title} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: `${i * 100}ms`, animationDuration: "500ms" }}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <AnimatedValue value={card.value} className="text-2xl font-bold tabular-nums" />
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
