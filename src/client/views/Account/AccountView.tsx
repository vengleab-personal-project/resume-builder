"use client";

import React from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, LogOut, Send, ShieldCheck } from 'lucide-react';
import { Input } from '@/client/components/ui/FormElements';
import { TelegramLoginButton } from '@/client/features/Auth/components/TelegramLoginButton';
import { useTranslations } from '@/client/hooks/useTranslations';
import { ENV } from '@/shared/config/env';
import { AUTH_ROUTES } from '@/shared/config/auth';
import { useAccountLogic } from './useAccountLogic';

export const AccountView = () => {
  const { t } = useTranslations('account');
  const { t: tAuth } = useTranslations('auth');
  const vm = useAccountLogic();

  if (vm.isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!vm.user) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-slate-500">
        <p>{tAuth.errors.UNAUTHENTICATED}</p>
        <Link href={AUTH_ROUTES.LOGIN} className="font-bold text-indigo-600 hover:text-indigo-700">
          {tAuth.login.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.subtitle}</p>
        </header>

        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className="text-slate-500">{t.username}</dt>
            <dd className="font-semibold text-slate-900">{vm.user.username}</dd>
            <dt className="text-slate-500">{t.role}</dt>
            <dd className="font-semibold text-slate-900">{vm.user.role}</dd>
            <dt className="text-slate-500">{t.memberSince}</dt>
            <dd className="font-semibold text-slate-900">
              {new Date(vm.user.createdAt).toLocaleDateString()}
            </dd>
          </dl>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
            <Send size={15} className="text-sky-500" />
            {t.telegramSection}
          </h2>

          {vm.user.hasTelegram ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span>
                  {tAuth.telegram.linked}
                  {vm.user.telegramUsername ? ` · @${vm.user.telegramUsername}` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={vm.telegram.handleUnlink}
                disabled={vm.telegram.isUnlinking}
                className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              >
                {vm.telegram.isUnlinking ? tAuth.telegram.unlinking : tAuth.telegram.unlink}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-500">{tAuth.telegram.notLinked}</p>
              {ENV.TELEGRAM_BOT_USERNAME ? (
                <div className="flex flex-col items-start gap-2">
                  <p className="text-xs text-slate-400">
                    {vm.telegram.isLinking ? tAuth.telegram.linking : tAuth.telegram.link}
                  </p>
                  <TelegramLoginButton onAuth={vm.telegram.handleAuth} />
                </div>
              ) : (
                <p className="text-xs text-slate-400">{tAuth.errors.TELEGRAM_NOT_CONFIGURED}</p>
              )}
            </div>
          )}

          {vm.telegram.error && <ErrorNote message={vm.telegram.error} />}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
            <ShieldCheck size={15} className="text-indigo-500" />
            {vm.user.hasPassword ? t.changePassword : t.setPassword}
          </h2>

          {!vm.user.hasPassword && (
            <p className="mb-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
              {t.noPasswordNotice}
            </p>
          )}

          <form onSubmit={vm.password.handleSavePassword}>
            {vm.user.hasPassword && (
              <Input
                label={t.currentPassword}
                type="password"
                autoComplete="current-password"
                value={vm.password.currentPassword}
                onChange={(e) => vm.password.setCurrentPassword(e.target.value)}
                required
              />
            )}
            <Input
              label={t.newPassword}
              type="password"
              autoComplete="new-password"
              value={vm.password.newPassword}
              onChange={(e) => vm.password.setNewPassword(e.target.value)}
              required
            />
            <Input
              label={t.confirmNewPassword}
              type="password"
              autoComplete="new-password"
              value={vm.password.confirmPassword}
              onChange={(e) => vm.password.setConfirmPassword(e.target.value)}
              required
            />

            {vm.password.error && <ErrorNote message={vm.password.error} />}

            {vm.password.saved && (
              <div className="flex items-start gap-2 px-3 py-2.5 mb-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-medium text-emerald-700">
                <CheckCircle2 size={14} className="mt-px flex-shrink-0" />
                <span>{t.passwordSaved}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={vm.password.isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-bold transition-colors disabled:opacity-50"
            >
              {vm.password.isSaving ? t.savingPassword : t.savePassword}
            </button>
          </form>
        </section>

        <section className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6">
          <button
            type="button"
            onClick={() => vm.handleSignOut(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <LogOut size={15} />
            {t.signOut}
          </button>
          <button
            type="button"
            onClick={() => vm.handleSignOut(true)}
            className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors"
          >
            {t.signOutEverywhere}
          </button>
        </section>

        <Link
          href="/builder"
          className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
        >
          {t.backToApp}
        </Link>
      </div>
    </div>
  );
};

const ErrorNote = ({ message }: { message: string }) => (
  <div
    role="alert"
    className="flex items-start gap-2 px-3 py-2.5 mt-3 mb-3 bg-red-50 border border-red-200 rounded-md text-xs font-medium text-red-700"
  >
    <AlertCircle size={14} className="mt-px flex-shrink-0" />
    <span>{message}</span>
  </div>
);
