"use client";

import { useEffect } from 'react';
import { useCoinStore } from '@/client/store/coin-store';
import { useSession } from '@/client/features/Auth/useSession';

export function useCoinBalanceLogic() {
  const { user } = useSession();
  const balance = useCoinStore((state) => state.balance);
  const isLoading = useCoinStore((state) => state.isLoading);
  const refreshBalance = useCoinStore((state) => state.refreshBalance);

  useEffect(() => {
    if (!user) return;
    void refreshBalance();
  }, [user, refreshBalance]);

  // Another tab may have completed a purchase; re-read on focus rather than
  // polling, so an idle tab costs nothing.
  useEffect(() => {
    if (!user) return;

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshBalance();
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user, refreshBalance]);

  return {
    isSignedIn: Boolean(user),
    balance,
    isLoading,
  };
}
