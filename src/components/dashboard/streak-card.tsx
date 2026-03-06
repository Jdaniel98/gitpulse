"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy, Zap } from "lucide-react";
import type { StreakInfo } from "@/lib/types";

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
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
