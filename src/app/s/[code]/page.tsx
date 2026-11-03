import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getShareViewerState } from '@/server/modules/share/publicShare';
import { SHARE_UNLOCK_COOKIE } from '@/shared/config/share';
import SharedResume from '@/client/views/SharedResume/SharedResume';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Deliberately generic: no name or title, so link previews and anything that reads
// the HTML learn nothing about whose CV this is.
export const metadata: Metadata = {
  title: 'Shared resume',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  referrer: 'no-referrer',
};

type PageProps = { params: Promise<{ code: string }> };

// Wiring only: whether the link works and whether it needs the passcode. The CV is
// never rendered here - the client fetches it from ./content after load.
export default async function SharedResumePage({ params }: PageProps) {
  const { code } = await params;
  const state = await getShareViewerState(code, (await cookies()).get(SHARE_UNLOCK_COOKIE)?.value);
  if (!state) notFound();

  return <SharedResume code={code} needsPasscode={state.needsPasscode} />;
}
