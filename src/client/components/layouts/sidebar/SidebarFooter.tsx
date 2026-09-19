import Link from 'next/link';
import { Coins, LogOut, Settings, UserRound } from 'lucide-react';
import type { PublicUser } from '@/shared/types/auth';
import type { SupportedLocale } from '@/shared/types';

export type SidebarFooterLabels = {
  coins: string;
  topUp: string;
  admin: string;
  account: string;
  signOut: string;
  language: string;
};

export type SidebarFooterProps = {
  labels: SidebarFooterLabels;
  user: PublicUser | null;
  isAdmin: boolean;
  balance: number | null;
  locale: SupportedLocale;
  collapsed: boolean;
  isAdminActive: boolean;
  isAccountActive: boolean;
  onToggleLanguage: () => void;
  onSignOut: () => void;
  /** Set in the mobile drawer, which must close itself once you pick a page. */
  onNavigate?: () => void;
};

const rowBase =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors';

/**
 * Everything that is about the account rather than about a document.
 *
 * Split off from the navigation on purpose: these used to sit in the same
 * undifferentiated stack of icons as the nav, which made "where do I buy
 * coins" and "where do I write a CV" look like the same kind of question.
 */
export const SidebarFooter = ({
  labels,
  user,
  isAdmin,
  balance,
  locale,
  collapsed,
  isAdminActive,
  isAccountActive,
  onToggleLanguage,
  onSignOut,
  onNavigate,
}: SidebarFooterProps) => (
  <div className="border-t border-white/10 p-3">
    {user && (
      <Link
        href="/billing"
        onClick={onNavigate}
        title={collapsed ? labels.coins : undefined}
        className={`${rowBase} mb-1 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 ${
          collapsed ? 'flex-col gap-0.5 px-0 py-1.5' : ''
        }`}
      >
        <Coins size={18} className="shrink-0" />
        {/* The number stays visible in the rail. A balance you have to expand
            the menu to read is a balance you will not notice running out. */}
        {collapsed && (
          <span className="text-[10px] font-bold tabular-nums leading-none">
            {balance === null ? '—' : balance}
          </span>
        )}
        {!collapsed && (
          <>
            <span className="flex-1 tabular-nums">
              {balance === null ? '—' : balance} {labels.coins}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wide text-amber-300/80">
              {labels.topUp}
            </span>
          </>
        )}
      </Link>
    )}

    <button
      type="button"
      onClick={onToggleLanguage}
      title={collapsed ? labels.language : undefined}
      className={`${rowBase} text-slate-400 hover:bg-white/5 hover:text-slate-100 ${
        collapsed ? 'justify-center px-0' : ''
      }`}
    >
      <span
        aria-hidden
        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-[10px] font-black text-indigo-300"
      >
        {locale === 'en' ? 'EN' : 'ខ្ម'}
      </span>
      {!collapsed && (
        <span className="flex-1 text-left">
          {locale === 'en' ? 'English' : 'ភាសាខ្មែរ'}
        </span>
      )}
    </button>

    {/* Chrome only — requireAdmin() on every /api/admin/* handler is what
        actually gates the capability. */}
    {isAdmin && (
      <Link
        href="/admin"
        onClick={onNavigate}
        title={collapsed ? labels.admin : undefined}
        aria-current={isAdminActive ? 'page' : undefined}
        className={`${rowBase} ${
          isAdminActive
            ? 'bg-white/10 text-white'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
        } ${collapsed ? 'justify-center px-0' : ''}`}
      >
        <Settings size={18} className="shrink-0" />
        {!collapsed && <span className="flex-1 text-left">{labels.admin}</span>}
      </Link>
    )}

    <Link
      href="/account"
      onClick={onNavigate}
      title={collapsed ? (user?.username ?? labels.account) : undefined}
      aria-current={isAccountActive ? 'page' : undefined}
      className={`${rowBase} ${
        isAccountActive
          ? 'bg-white/10 text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
      } ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <UserRound size={18} className="shrink-0" />
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate text-left">{user?.username ?? labels.account}</span>
      )}
    </Link>

    {user && (
      <button
        type="button"
        onClick={onSignOut}
        title={collapsed ? labels.signOut : undefined}
        className={`${rowBase} text-slate-400 hover:bg-red-500/10 hover:text-red-300 ${
          collapsed ? 'justify-center px-0' : ''
        }`}
      >
        <LogOut size={18} className="shrink-0" />
        {!collapsed && <span className="flex-1 text-left">{labels.signOut}</span>}
      </button>
    )}
  </div>
);
