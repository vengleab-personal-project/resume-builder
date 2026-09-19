import type { ReactNode } from 'react';

export type SidebarSectionProps = {
  label: string;
  collapsed: boolean;
  children: ReactNode;
};

/**
 * A titled group of destinations.
 *
 * When collapsed the heading would not fit, so it becomes a hairline rule: the
 * grouping is still visible, which is most of what the heading was doing, and
 * the heading itself stays in the accessible name of the group.
 */
export const SidebarSection = ({ label, collapsed, children }: SidebarSectionProps) => (
  <div role="group" aria-label={label} className="space-y-1">
    {collapsed ? (
      <hr aria-hidden className="mx-3 my-3 border-white/10" />
    ) : (
      <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
    )}
    {children}
  </div>
);
