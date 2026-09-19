"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCoinStore } from '@/client/store/coin-store';
import { useTranslations } from '@/client/hooks/useTranslations';
import type {
  CoinPackageDTO,
  PaymentOrderDTO,
  PaymentProviderKey,
  PaymentProviderOptionDTO,
} from '@/shared/types/coins';

export type TopUpStep = 'select' | 'pay' | 'success' | 'error';

const POLL_INTERVAL_MS = 3000;

export function useTopUpLogic() {
  const { t } = useTranslations('billing');

  const isOpen = useCoinStore((state) => state.topUpOpen);
  const requiredCoins = useCoinStore((state) => state.requiredCoins);
  const closeTopUp = useCoinStore((state) => state.closeTopUp);
  const setBalance = useCoinStore((state) => state.setBalance);
  const refreshBalance = useCoinStore((state) => state.refreshBalance);

  const [step, setStep] = useState<TopUpStep>('select');
  const [packages, setPackages] = useState<CoinPackageDTO[]>([]);
  const [providers, setProviders] = useState<PaymentProviderOptionDTO[]>([]);
  const [provider, setProvider] = useState<PaymentProviderKey | null>(null);
  const [order, setOrder] = useState<PaymentOrderDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderIdRef = useRef<string | null>(null);
  orderIdRef.current = order?.id ?? null;

  const loadCatalogue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/packages', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));

      const body = (await res.json()) as {
        packages: CoinPackageDTO[];
        providers: PaymentProviderOptionDTO[];
      };
      setPackages(body.packages);
      setProviders(body.providers);
      setProvider((current) => current ?? body.providers[0]?.id ?? null);
    } catch {
      setError(t.errors.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isOpen) return;
    void loadCatalogue();
  }, [isOpen, loadCatalogue]);

  const reset = useCallback(() => {
    setStep('select');
    setOrder(null);
    setError(null);
  }, []);

  const close = useCallback(() => {
    closeTopUp();
    reset();
  }, [closeTopUp, reset]);

  const selectPackage = useCallback(
    async (packageId: string) => {
      if (!provider) {
        setError(t.errors.noProvider);
        setStep('error');
        return;
      }

      setIsCreating(true);
      setError(null);
      try {
        const res = await fetch('/api/payments/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageId, provider }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? String(res.status));
        }

        const body = (await res.json()) as { order: PaymentOrderDTO };
        setOrder(body.order);
        setStep('pay');
      } catch {
        setError(t.errors.createFailed);
        setStep('error');
      } finally {
        setIsCreating(false);
      }
    },
    [provider, t]
  );

  const checkStatus = useCallback(async () => {
    const orderId = orderIdRef.current;
    if (!orderId) return;

    try {
      const res = await fetch(`/api/payments/orders/${orderId}/status`, { cache: 'no-store' });
      // 503 means the provider (or our token) is unavailable, never that the
      // payment failed. Keep polling instead of showing a failure.
      if (res.status === 503) return;
      if (!res.ok) return;

      const body = (await res.json()) as { order: PaymentOrderDTO; balance: number };
      setOrder((current) => ({ ...body.order, qrSvg: body.order.qrSvg ?? current?.qrSvg ?? null }));
      setBalance(body.balance);

      if (body.order.status === 'PAID') {
        setStep('success');
      } else if (body.order.status !== 'PENDING') {
        setError(t.errors.orderStatus[body.order.status] ?? t.errors.createFailed);
        setStep('error');
      }
    } catch {
      // Network blips are expected while polling; the next tick retries.
    }
  }, [setBalance, t]);

  // Polling pauses entirely while the tab is hidden: a backgrounded checkout
  // must not keep hitting the provider, and the server-side debounce would
  // throttle it anyway.
  useEffect(() => {
    if (!isOpen || step !== 'pay') return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer !== null) return;
      void checkStatus();
      timer = setInterval(() => void checkStatus(), POLL_INTERVAL_MS);
    };

    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stop();
      else start();
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isOpen, step, checkStatus]);

  const cancelOrder = useCallback(async () => {
    const orderId = orderIdRef.current;
    if (orderId) {
      await fetch(`/api/payments/orders/${orderId}/cancel`, { method: 'POST' }).catch(() => null);
    }
    reset();
  }, [reset]);

  const payWithMock = useCallback(async () => {
    const orderId = orderIdRef.current;
    if (!orderId) return;

    const res = await fetch(`/api/payments/orders/${orderId}/mock-pay`, { method: 'POST' }).catch(
      () => null
    );
    if (res?.ok) await checkStatus();
  }, [checkStatus]);

  const finish = useCallback(async () => {
    await refreshBalance();
    close();
  }, [refreshBalance, close]);

  return {
    isOpen,
    step,
    packages,
    providers,
    provider,
    setProvider,
    order,
    isLoading,
    isCreating,
    error,
    requiredCoins,
    isMockProvider: provider === 'MOCK',
    selectPackage,
    cancelOrder,
    payWithMock,
    retry: reset,
    finish,
    close,
  };
}

export type TopUpViewModel = ReturnType<typeof useTopUpLogic>;
