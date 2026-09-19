import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export type SidebarNavItemProps = {
  href: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  isActive: boolean;
  collapsed: boolean;
  /** Set in the mobile drawer, which must close itself once you pick a page. */
  onNavigate?: () => void;
};

/**
 * One destination.
 *
 * `aria-current="page"` carries the active state to assistive technology; the
 * indigo bar and tint are the sighted half of the same signal, never the only
 * half. When collapsed the label moves into `title` and a tooltip, so the rail
 * stays usable without becoming a guessing game.
 */
export const SidebarNavItem = ({
  href,
  label,
  hint,
  icon: Icon,
  isActive,
  collapsed,
  onNavigate,
}: SidebarNavItemProps) => (
  <Link
    href={href}
    onClick={onNavigate}
    title={collapsed ? label : undefined}
    aria-current={isActive ? 'page' : undefined}
    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
      isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
    } ${collapsed ? 'justify-center px-0' : ''}`}
  >
    {isActive && (
      <span
        aria-hidden
        className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400"
      />
    )}

    <Icon size={19} className="shrink-0" />

    {!collapsed && (
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block truncate text-[11px] text-slate-500">{hint}</span>}
      </span>
    )}

    {collapsed && (
      <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-100 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    )}
  </Link>
);
