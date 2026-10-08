"use client";

import { useCallback, useEffect, useState } from 'react';
import { useCoinStore } from '@/client/store/coin-store';
import { useTranslations } from '@/client/hooks/useTranslations';
import type { CoinTransactionDTO, PaymentOrderDTO } from '@/shared/types/coins';

export function useBillingLogic() {
  const { t } = useTranslations('billing');

  const balance = useCoinStore((state) => state.balance);
  const openTopUp = useCoinStore((state) => state.openTopUp);
  const topUpOpen = useCoinStore((state) => state.topUpOpen);
  const refreshBalance = useCoinStore((state) => state.refreshBalance);

  const [transactions, setTransactions] = useState<CoinTransactionDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [orders, setOrders] = useState<PaymentOrderDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [txRes, orderRes] = await Promise.all([
        fetch('/api/coins/transactions?limit=25', { cache: 'no-store' }),
        fetch('/api/payments/orders', { cache: 'no-store' }),
      ]);

      if (!txRes.ok || !orderRes.ok) throw new Error('load failed');

      const txBody = (await txRes.json()) as {
        transactions: CoinTransactionDTO[];
        nextCursor: string | null;
      };
      const orderBody = (await orderRes.json()) as { orders: PaymentOrderDTO[] };

      setTransactions(txBody.transactions);
      setNextCursor(txBody.nextCursor);
      setOrders(orderBody.orders);
    } catch {
      setError(t.errors.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refreshBalance();
    void load();
  }, [refreshBalance, load]);

  // A completed purchase invalidates both lists; reload when the modal closes.
  useEffect(() => {
    if (topUpOpen) return;
    void load();
  }, [topUpOpen, load]);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;

    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/coins/transactions?limit=25&cursor=${nextCursor}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;

      const body = (await res.json()) as {
        transactions: CoinTransactionDTO[];
        nextCursor: string | null;
      };
      setTransactions((current) => [...current, ...body.transactions]);
      setNextCursor(body.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor]);

  return {
    balance,
    transactions,
    orders,
    isLoading,
    isLoadingMore,
    hasMore: nextCursor !== null,
    error,
    loadMore,
    openTopUp: () => openTopUp(),
  };
}
