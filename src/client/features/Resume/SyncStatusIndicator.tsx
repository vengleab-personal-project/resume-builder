"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { useResumeStore } from '@/client/store/resume-store';
import { useTranslations } from '@/client/hooks/useTranslations';
import { cn } from '@/shared/lib/utils';

// Re-renders the relative timestamp on a timer; without it "Saved · just now"
// would stay frozen for as long as the user does not type.
const TICK_MS = 30_000;

// The clock is an external system: it is sampled from a timer into state, never
// read during render, so the component stays pure and never mismatches between
// the server-rendered markup and the first client render.
function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const initial = setTimeout(tick, 0);
    const interval = setInterval(tick, TICK_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  return now;
}

function useRelativeTime(iso: string | null): string | null {
  const { t } = useTranslations('sync');
  const now = useNow();

  if (!iso || now === null) return null;

  const elapsedMinutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (elapsedMinutes < 1) return t.justNow;
  if (elapsedMinutes < 60) return t.minutesAgo.replace('{count}', String(elapsedMinutes));
  return t.hoursAgo.replace('{count}', String(Math.floor(elapsedMinutes / 60)));
}

export const SyncStatusIndicator = ({ className }: { className?: string }) => {
  const { t } = useTranslations('sync');
  const syncStatus = useResumeStore((state) => state.syncStatus);
  const lastSyncedAt = useResumeStore((state) => state.lastSyncedAt);
  const relative = useRelativeTime(lastSyncedAt);

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (syncStatus === 'idle' && !lastSyncedAt) return null;

  if (!isOnline) {
    return (
      <Badge className={className} tone="text-amber-600">
        <CloudOff size={13} />
        <span>{t.offline}</span>
      </Badge>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <Badge className={className} tone="text-slate-500">
        <Loader2 size={13} className="animate-spin" />
        <span>{t.saving}</span>
      </Badge>
    );
  }

  if (syncStatus === 'error') {
    return (
      <Badge className={className} tone="text-red-600">
        <AlertTriangle size={13} />
        <span>{t.error}</span>
      </Badge>
    );
  }

  if (syncStatus === 'conflict') {
    return (
      <Badge className={className} tone="text-amber-600">
        <RefreshCw size={13} />
        <span>{t.conflict}</span>
      </Badge>
    );
  }

  return (
    <Badge className={className} tone="text-slate-400">
      <Check size={13} className="text-emerald-500" />
      <span>{relative ? t.savedAt.replace('{time}', relative) : t.saved}</span>
    </Badge>
  );
};

const Badge = ({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone: string;
}) => (
  <div
    className={cn(
      'flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap',
      tone,
      className
    )}
  >
    {children}
  </div>
);
