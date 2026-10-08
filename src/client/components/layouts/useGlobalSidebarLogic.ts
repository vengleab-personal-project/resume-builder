'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Files, IdCard, Sparkles, type LucideIcon } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { useSession } from '@/client/features/Auth/useSession';
import { useUiStore } from '@/client/store/ui-store';
import { AUTH_ROUTES } from '@/shared/config/auth';

export interface SidebarNavEntry {
  href: string;
  label: string;
  /** One line saying what this screen is for. Only shown when expanded. */
  hint?: string;
  icon: LucideIcon;
}

export interface SidebarNavGroup {
  id: string;
  label: string;
  items: SidebarNavEntry[];
}

/**
 * Whether a nav entry owns the current route.
 *
 * A bare `startsWith` is wrong here and gets more wrong as routes are added:
 * `/resume` would light up `/resumes`, and any future `/builder-templates`
 * would light up `/builder`. Matching on a path boundary is the only version
 * that stays correct without anyone having to remember this rule.
 */
export function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const useGlobalSidebarLogic = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useTranslations('sidebar');
  const { user, signOut } = useSession();

  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleCollapsed = useUiStore((state) => state.toggleSidebar);

  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // Escape closes it, because a full-screen overlay with no keyboard exit is a
  // trap.
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDrawerOpen]);

  /**
   * Grouped, because the flat list stopped being readable the moment there were
   * two things called some kind of "resume". "Create" vs "Manage" answers the
   * question the old sidebar could not: which of these makes a new document,
   * and which one shows me the ones I have.
   */
  const groups: SidebarNavGroup[] = [
    {
      id: 'create',
      label: t.groupCreate,
      items: [
        {
          href: '/builder',
          label: t.resumeBuilder,
          hint: t.resumeBuilderHint,
          icon: FileText,
        },
        {
          href: '/basic-resume',
          label: t.basicResume,
          hint: t.basicResumeHint,
          icon: IdCard,
        },
      ],
    },
    {
      id: 'manage',
      label: t.groupManage,
      items: [
        { href: '/resumes', label: t.myResumes, icon: Files },
        { href: '/evaluation', label: t.aiEvaluation, icon: Sparkles },
      ],
    },
  ];

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace(AUTH_ROUTES.LOGIN);
    router.refresh();
  }, [router, signOut]);

  const toggleLanguage = useCallback(
    () => setLocale(locale === 'en' ? 'km' : 'en'),
    [locale, setLocale]
  );

  return {
    t,
    locale,
    user,
    isAdmin: user?.role === 'ADMIN',
    pathname,
    groups,
    collapsed,
    toggleCollapsed,
    isDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    handleSignOut,
    toggleLanguage,
  };
};
