"use client";

import { useEffect, useState } from "react";
import {
  FlaskConical,
  Wallet,
  Crown,
  Sparkles,
  Star,
} from "lucide-react";
import { getCollectionStats } from "@/lib/actions/perfumes";

interface CollectionStatsProps {
  userId: string;
}

interface Stats {
  total: number;
  totalValue: number;
  favoriteBrand: string;
  topNote: string;
  avgRating: number;
}

export function CollectionStats({ userId }: CollectionStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStats(null);

    getCollectionStats(userId).then((data) => {
      if (!cancelled) setStats(data);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const valueLabel = stats
    ? new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN",
        maximumFractionDigits: 0,
      }).format(stats.totalValue)
    : "";

  if (!stats) {
    return (
      <section className="mb-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-card border border-border/70 px-3 py-3 animate-pulse"
            >
              <div className="w-8 h-8 bg-muted rounded-lg mb-2.5" />
              <div className="h-5 w-20 bg-muted rounded mb-1.5" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (stats.total === 0) return null;

  const statItems = [
    {
      label: "Butelek w kolekcji",
      value: String(stats.total),
      icon: FlaskConical,
      tint: "bg-primary/10 text-primary",
    },
    {
      label: "Szacowana wartość",
      value: valueLabel,
      icon: Wallet,
      tint: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Ulubiona marka",
      value: stats.favoriteBrand || "—",
      icon: Crown,
      tint: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Ulubiona nuta",
      value: stats.topNote || "—",
      icon: Sparkles,
      tint: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Średnia ocena",
      value: stats.avgRating ? stats.avgRating.toFixed(1) : "—",
      icon: Star,
      tint: "bg-primary/10 text-primary",
    },
  ];

  return (
    <section className="mb-3">
      <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">
        Kolekcja w liczbach
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {statItems.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-lg bg-secondary/40 border border-border/60 px-2.5 py-2 min-w-0"
            >
              <div className={`w-fit p-1.5 rounded-md mb-1.5 ${stat.tint}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-lg font-bold text-foreground leading-tight truncate">
                {stat.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight truncate">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
