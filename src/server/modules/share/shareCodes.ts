import 'server-only';
import { randomBytes, randomInt } from 'node:crypto';
import type { ShareAccess } from '@/server/db/generated/prisma';

/**
 * URL codes for /s/<code>. Both kinds are random - never derived from the resume,
 * the user or a counter - so a code says nothing and the next one cannot be guessed.
 *
 * - CODE links: the code is the only key, so it is long: 18 random bytes as base64url,
 *   24 characters, 144 bits.
 * - PASSCODE links: the passcode is the key, so the code only has to be unique and
 *   comfortable to read out or type: 10 characters from an alphabet with no
 *   look-alikes (no 0/O, 1/l/I), about 50 bits.
 */

const TYPEABLE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
const TYPEABLE_LENGTH = 10;

export function generateShareCode(access: ShareAccess): string {
  if (access === 'CODE') return randomBytes(18).toString('base64url');
  let code = '';
  for (let i = 0; i < TYPEABLE_LENGTH; i += 1) {
    code += TYPEABLE_ALPHABET[randomInt(TYPEABLE_ALPHABET.length)];
  }
  return code;
}

/** Shape check before any database lookup: anything else is not one of ours. */
export const isWellFormedShareCode = (code: string): boolean =>
  /^[A-Za-z0-9_-]{24}$/.test(code) || new RegExp(`^[${TYPEABLE_ALPHABET}]{${TYPEABLE_LENGTH}}$`).test(code);
