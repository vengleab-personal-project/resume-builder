'use client';

import { Menu, X } from 'lucide-react';
import { useCoinBalanceLogic } from '@/client/features/Coins';
import { useGlobalSidebarLogic, isRouteActive } from './useGlobalSidebarLogic';
import { SidebarBrand } from './sidebar/SidebarBrand';
import { SidebarFooter } from './sidebar/SidebarFooter';
import { SidebarNavItem } from './sidebar/SidebarNavItem';
import { SidebarSection } from './sidebar/SidebarSection';

/**
 * The app's primary navigation.
 *
 * Labelled rather than icon-only. The previous rail showed four unlabelled
 * glyphs whose meaning only appeared on hover, which cannot work on a touch
 * screen at all and stopped working on desktop the moment the app had two
 * different things called a "resume". Labels, one-line hints on the two
 * creation routes, and named groups make "which of these builds what" answerable
 * without clicking anything.
 *
 * Collapsing back to a rail is kept as a choice, not the default, and is
 * remembered per browser.
 */
export function GlobalSidebar() {
  const vm = useGlobalSidebarLogic();
  const { balance } = useCoinBalanceLogic();

  const footerLabels = {
    coins: vm.t.coins,
    topUp: vm.t.topUp,
    admin: vm.t.admin,
    account: vm.t.account,
    signOut: vm.t.signOut,
    language: vm.t.language,
  };

  // `onNavigate` is set only for the drawer: picking a page there has to close
  // the overlay covering it. Closing on the click rather than on the route
  // change keeps it instant and keeps the state out of an effect.
  const panel = (collapsed: boolean, showToggle: boolean, onNavigate?: () => void) => (
    <>
      <SidebarBrand
        appTitle={vm.t.appTitle}
        homeLabel={vm.t.backToHome}
        collapseLabel={vm.t.collapse}
        expandLabel={vm.t.expand}
        collapsed={collapsed}
        showToggle={showToggle}
        onToggle={vm.toggleCollapsed}
        onNavigate={onNavigate}
      />

      <nav aria-label={vm.t.navLabel} className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {vm.groups.map((group) => (
          <SidebarSection key={group.id} label={group.label} collapsed={collapsed}>
            {group.items.map((item) => (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                label={item.label}
                hint={item.hint}
                icon={item.icon}
                isActive={isRouteActive(vm.pathname, item.href)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </SidebarSection>
        ))}
      </nav>

      <SidebarFooter
        labels={footerLabels}
        user={vm.user}
        isAdmin={vm.isAdmin}
        balance={balance}
        locale={vm.locale}
        collapsed={collapsed}
        isAdminActive={isRouteActive(vm.pathname, '/admin')}
        isAccountActive={isRouteActive(vm.pathname, '/account')}
        onToggleLanguage={vm.toggleLanguage}
        onSignOut={() => void vm.handleSignOut()}
        onNavigate={onNavigate}
      />
    </>
  );

  return (
    <>
      {/* Mobile: a real top bar, because a 64px rail permanently eating a phone
          screen is worse than a button that summons one. */}
      <header className="flex items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 py-2.5 lg:hidden print:hidden">
        <button
          type="button"
          onClick={vm.openDrawer}
          aria-label={vm.t.openMenu}
          aria-expanded={vm.isDrawerOpen}
          className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm font-bold text-white">{vm.t.appTitle}</span>
      </header>

      {vm.isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <button
            type="button"
            aria-label={vm.t.closeMenu}
            onClick={vm.closeDrawer}
            className="absolute inset-0 h-full w-full bg-slate-950/60"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-slate-900 shadow-2xl">
            <button
              type="button"
              onClick={vm.closeDrawer}
              aria-label={vm.t.closeMenu}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
            {panel(false, false, vm.closeDrawer)}
          </aside>
        </div>
      )}

      <aside
        className={`hidden h-full shrink-0 flex-col bg-slate-900 transition-[width] duration-200 lg:flex print:hidden ${
          vm.collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {panel(vm.collapsed, true)}
      </aside>
    </>
  );
}
