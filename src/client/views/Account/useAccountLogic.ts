"use client";

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/client/hooks/useTranslations';
import { authErrorMessage, networkErrorMessage } from '@/client/features/Auth/authErrors';
import { refreshSession, setSessionUser, useSession } from '@/client/features/Auth/useSession';
import { useTelegramAuth } from '@/client/features/Auth/useTelegramAuth';
import { AUTH_ROUTES } from '@/shared/config/auth';
import type { PublicUser } from '@/shared/types/auth';

export function useAccountLogic() {
  const router = useRouter();
  const { t } = useTranslations('auth');
  const { user, isLoading, signOut } = useSession();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [isUnlinking, setIsUnlinking] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  const onLinked = useCallback((linked: PublicUser) => {
    setSessionUser(linked);
    setTelegramError(null);
  }, []);

  const telegram = useTelegramAuth({ mode: 'link', onLinked });

  const handleSavePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (newPassword !== confirmPassword) {
        setPasswordError(t.signup.passwordMismatch);
        return;
      }

      setIsSavingPassword(true);
      setPasswordError(null);
      setPasswordSaved(false);

      try {
        const res = await fetch('/api/auth/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // The route only requires a current password when one is already
            // set, so a Telegram-only account can send just the new one.
            currentPassword: currentPassword || undefined,
            newPassword,
          }),
        });

        if (!res.ok) {
          setPasswordError(authErrorMessage(t, await res.json().catch(() => null)));
          return;
        }

        setPasswordSaved(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Setting a password bumps tokenVersion and re-issues this device's
        // cookie, so hasPassword on the cached session is now stale.
        await refreshSession();
      } catch {
        setPasswordError(networkErrorMessage(t));
      } finally {
        setIsSavingPassword(false);
      }
    },
    [confirmPassword, currentPassword, newPassword, t]
  );

  const handleUnlinkTelegram = useCallback(async () => {
    if (!window.confirm(t.telegram.unlinkConfirm)) return;

    setIsUnlinking(true);
    setTelegramError(null);

    try {
      const res = await fetch('/api/auth/telegram/link', { method: 'DELETE' });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setTelegramError(authErrorMessage(t, body));
        return;
      }

      setSessionUser((body as { user: PublicUser }).user);
    } catch {
      setTelegramError(networkErrorMessage(t));
    } finally {
      setIsUnlinking(false);
    }
  }, [t]);

  const handleSignOut = useCallback(
    async (everywhere: boolean) => {
      await signOut(everywhere);
      router.replace(AUTH_ROUTES.LOGIN);
      router.refresh();
    },
    [router, signOut]
  );

  return {
    user,
    isLoading,
    password: {
      currentPassword,
      setCurrentPassword,
      newPassword,
      setNewPassword,
      confirmPassword,
      setConfirmPassword,
      isSaving: isSavingPassword,
      error: passwordError,
      saved: passwordSaved,
      handleSavePassword,
    },
    telegram: {
      handleAuth: telegram.handleAuth,
      isLinking: telegram.isLoading,
      isUnlinking,
      error: telegramError ?? telegram.error,
      handleUnlink: handleUnlinkTelegram,
    },
    handleSignOut,
  };
}
