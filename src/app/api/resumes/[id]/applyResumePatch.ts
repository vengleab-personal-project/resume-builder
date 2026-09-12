import 'server-only';
import { NextResponse } from 'next/server';
import type { Prisma } from '@/server/db/generated/prisma';
import { HttpError } from '@/server/auth/guards';
import {
  updateResumeWithVersionCheck,
  type ResumePatch,
} from '@/server/services/resumePersistenceService';
import { updateResumeSchema } from '@/shared/lib/validation/resumeSchemas';

// Shared by PATCH /api/resumes/[id] and its sendBeacon twin. The two differ
// only in HTTP verb (sendBeacon can only POST), so the body handling lives here
// rather than being duplicated and drifting.
export async function applyResumePatch(
  userId: string,
  id: string,
  body: unknown
): Promise<NextResponse> {
  const parsed = updateResumeSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid resume patch');
  }

  const { version, title, data, sectionOrder, theme } = parsed.data;

  const patch: ResumePatch = {};
  if (title !== undefined) patch.title = title;
  if (data !== undefined) patch.data = data as Prisma.InputJsonValue;
  if (sectionOrder !== undefined) patch.sectionOrder = sectionOrder as Prisma.InputJsonValue;
  if (theme !== undefined) patch.theme = theme as Prisma.InputJsonValue;

  const outcome = await updateResumeWithVersionCheck(userId, id, version, patch);

  if (outcome.status === 'not-found') {
    throw new HttpError(404, 'NOT_FOUND', 'Resume not found');
  }

  if (outcome.status === 'conflict') {
    // The winning record travels with the 409 so the client can reconcile
    // without a follow-up GET on a connection that is often already closing.
    return NextResponse.json(
      { error: 'VERSION_CONFLICT', resume: outcome.resume },
      { status: 409 }
    );
  }

  return NextResponse.json({ resume: outcome.resume });
}
