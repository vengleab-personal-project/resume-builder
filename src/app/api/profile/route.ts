import { NextResponse, type NextRequest } from 'next/server';
import { assertSameOrigin, requireUser } from '@/server/modules/auth/guards';
import { HttpError, withErrorHandling } from '@/server/errors';
import { getOrCreateProfile, updateProfile } from '@/server/modules/profile/profileService';
import { updateProfileSchema } from '@/shared/lib/validation/profileSchemas';
import type {
  ProfileConflictResponse,
  ProfileUpdateResponse,
} from '@/shared/types/persistence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const profile = await getOrCreateProfile(user.id);

  return NextResponse.json({ profile }, { headers: { 'Cache-Control': 'no-store' } });
});

// Writes the profile and, in the same transaction, the same fields into the user's
// default resume. The other direction (resume -> profile) needs no route: it happens
// inside every resume write.
export const PATCH = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);

  const user = await requireUser();

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Invalid profile', {
      issues: parsed.error.issues.map((issue) => ({
        field: issue.path[0],
        message: issue.message,
      })),
    });
  }

  const { version, ...patch } = parsed.data;
  const outcome = await updateProfile(user.id, version, patch);

  if (outcome.status === 'conflict') {
    // The winning record travels with the 409, as with PATCH /api/resumes/[id].
    const conflict: ProfileConflictResponse = { error: 'VERSION_CONFLICT', profile: outcome.profile };
    return NextResponse.json(conflict, { status: 409 });
  }

  const response: ProfileUpdateResponse = { profile: outcome.profile, resume: outcome.resume };
  return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } });
});
