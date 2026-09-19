import Link from 'next/link';
import { FileCode2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export type SidebarBrandProps = {
  appTitle: string;
  homeLabel: string;
  collapseLabel: string;
  expandLabel: string;
  collapsed: boolean;
  /** Hidden in the mobile drawer, which has its own close control. */
  showToggle: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
};

export const SidebarBrand = ({
  appTitle,
  homeLabel,
  collapseLabel,
  expandLabel,
  collapsed,
  showToggle,
  onToggle,
  onNavigate,
}: SidebarBrandProps) => (
  <div
    className={`flex items-center gap-2 px-3 py-4 ${collapsed ? 'flex-col' : 'justify-between'}`}
  >
    <Link
      href="/"
      onClick={onNavigate}
      title={homeLabel}
      className="flex min-w-0 items-center gap-2.5 rounded-xl transition-opacity hover:opacity-80"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
        <FileCode2 size={18} strokeWidth={2.5} />
      </span>
      {!collapsed && (
        <span className="truncate text-sm font-bold text-white">{appTitle}</span>
      )}
    </Link>

    {showToggle && (
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? expandLabel : collapseLabel}
        title={collapsed ? expandLabel : collapseLabel}
        aria-expanded={!collapsed}
        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
      >
        {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
      </button>
    )}
  </div>
);
