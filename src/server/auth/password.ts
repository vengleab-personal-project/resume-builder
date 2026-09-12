import { hash, verify, type Algorithm } from '@node-rs/argon2';

// Intentionally NOT marked `server-only`: prisma/seed.ts imports this under
// plain tsx, where the `server-only` package resolves to its throwing entry
// point (it only no-ops under Next's react-server condition). Client usage is
// still impossible — @node-rs/argon2 is a native binding that cannot be
// bundled for the browser.

// `Algorithm` is an ambient const enum, which `isolatedModules` forbids reading
// members from, so Argon2id's value (2) is written out directly.
const ARGON2ID = 2 as Algorithm;

// OWASP's argon2id baseline: 19 MiB, 2 passes, 1 lane.
const ARGON2_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

// Verification dispatches on the PHC/modular-crypt prefix rather than assuming
// argon2. If @node-rs/argon2's prebuilt binary ever fails on a deploy target,
// bcryptjs can be added as a second branch here and existing argon2 hashes keep
// verifying — no migration, no user-visible change.
const ARGON2_PREFIX = '$argon2';

// A real argon2id hash of a value no user can supply. Verifying against it when
// the username doesn't exist makes the failure path cost the same as a wrong
// password, so response timing can't be used to enumerate accounts.
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$N2AQw5Fk4M8LKn2v5/EUcw$fr2O/20NVSK9V1oRr9eE+vJNWLvPJY/qt1gb19mO2qY';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined
): Promise<boolean> {
  if (!storedHash) {
    await fakeVerify();
    return false;
  }

  if (!storedHash.startsWith(ARGON2_PREFIX)) {
    console.error('Unrecognised password hash format; refusing to verify');
    return false;
  }

  try {
    return await verify(storedHash, password, ARGON2_OPTIONS);
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

export async function fakeVerify(password = 'never-matches'): Promise<void> {
  try {
    await verify(DUMMY_HASH, password, ARGON2_OPTIONS);
  } catch {
    // Result is irrelevant; this call exists only to burn the same CPU time.
  }
}
