// Bootstrap seed. Idempotent: re-running it updates the admin's password and
// role rather than creating duplicates.
//
// NOTE: verified against a throwaway postgres:16 container only — it has never
// run against the real (not-yet-provisioned) project database. Re-running it
// was confirmed not to overwrite admin edits to seeded rows.
// Run `npm run db:seed` once the database is provisioned.
//
// This file deliberately reads process.env directly instead of importing
// src/server/config/env.server.ts: that module imports `server-only`, which
// throws when resolved outside Next.js's react-server condition (i.e. under
// plain tsx, which is how this script runs).

import { PrismaClient } from '../src/server/db/generated/prisma';
import { hashPassword } from '../src/server/modules/auth/password';
import { FALLBACK_ACTION_COSTS, FALLBACK_CHAT_MODELS } from '../src/shared/config/constants';

const prisma = new PrismaClient();

async function seedAdmin(): Promise<void> {
  const username = (process.env.SEED_ADMIN_USERNAME || '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || '';

  if (!username || !password) {
    console.warn(
      'Skipping admin seed: SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD must both be set.'
    );
    return;
  }

  if (password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters long');
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { username },
    create: {
      username,
      passwordHash,
      role: 'ADMIN',
      displayName: 'Administrator',
    },
    update: {
      passwordHash,
      role: 'ADMIN',
      disabledAt: null,
      // Any session issued before a credential reset must stop working.
      tokenVersion: { increment: 1 },
    },
    select: { id: true, username: true, role: true },
  });

  console.log(`Seeded admin user: ${admin.username} (${admin.id})`);
}

// Bootstrap the registry from the static fallback list. Existing rows are left
// exactly as they are: an admin who renamed a model or turned one off must not
// have that undone by the next deploy's seed run.
async function seedChatModels(): Promise<void> {
  for (const model of FALLBACK_CHAT_MODELS) {
    await prisma.chatModel.upsert({
      where: { provider_modelId: { provider: model.provider, modelId: model.modelId } },
      create: {
        provider: model.provider,
        modelId: model.modelId,
        displayName: model.displayName,
        sortOrder: model.sortOrder,
        // isDefault is set separately: the partial unique index rejects a second
        // default, so it can only be claimed when no model holds it yet.
        isDefault: false,
      },
      update: {},
    });
  }

  const hasDefault = await prisma.chatModel.findFirst({ where: { isDefault: true } });
  if (!hasDefault) {
    const preferred = FALLBACK_CHAT_MODELS.find((model) => model.isDefault);
    if (preferred) {
      await prisma.chatModel.update({
        where: {
          provider_modelId: { provider: preferred.provider, modelId: preferred.modelId },
        },
        data: { isDefault: true, isActive: true },
      });
    }
  }

  const count = await prisma.chatModel.count();
  console.log(`Chat models present: ${count}`);
}

// Only the inherited (chatModelId = null) rows are seeded; per-model overrides
// are an admin decision, never a default.
async function seedActionCosts(): Promise<void> {
  for (const [action, coinCost] of Object.entries(FALLBACK_ACTION_COSTS)) {
    const existing = await prisma.actionCost.findFirst({
      where: { action: action as keyof typeof FALLBACK_ACTION_COSTS, chatModelId: null },
    });

    if (!existing) {
      await prisma.actionCost.create({
        data: { action: action as keyof typeof FALLBACK_ACTION_COSTS, chatModelId: null, coinCost },
      });
    }
  }

  console.log(`Action costs present: ${await prisma.actionCost.count()}`);
}

// Purchasable bundles. Prices are integer minor units; KHR has no minor unit,
// so 20000 is 20,000៛. Like the chat models, existing rows are left alone --
// an admin price change must survive the next deploy.
const COIN_PACKAGES = [
  {
    code: 'starter',
    name: 'Starter',
    description: 'Enough for a handful of refinements.',
    coinAmount: 50,
    bonusCoins: 0,
    priceMinor: 8000,
    currency: 'KHR' as const,
    sortOrder: 10,
  },
  {
    code: 'standard',
    name: 'Standard',
    description: 'The usual choice for an active job search.',
    coinAmount: 150,
    bonusCoins: 20,
    priceMinor: 20000,
    currency: 'KHR' as const,
    sortOrder: 20,
  },
  {
    code: 'pro',
    name: 'Professional',
    description: 'Best value per coin.',
    coinAmount: 400,
    bonusCoins: 80,
    priceMinor: 48000,
    currency: 'KHR' as const,
    sortOrder: 30,
  },
];

async function seedCoinPackages(): Promise<void> {
  for (const pkg of COIN_PACKAGES) {
    await prisma.coinPackage.upsert({
      where: { code: pkg.code },
      create: pkg,
      update: {},
    });
  }

  console.log(`Coin packages present: ${await prisma.coinPackage.count()}`);
}

// Mirrors SIGNUP_BONUS_COINS in src/server/services/coinService.ts, which is
// what grants it to real signups. Seeded accounts pre-date that code path, so
// they are topped up here -- through the ledger, never by writing coinBalance
// directly, or SUM(amount) would stop matching the balance.
const SIGNUP_BONUS_COINS = 10;

async function seedSignupBonuses(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { coinTransactions: { none: {} } },
    select: { id: true, username: true },
  });

  for (const user of users) {
    await prisma.$transaction(async (tx) => {
      const [{ coinBalance }] = await tx.$queryRaw<{ coinBalance: number }[]>`
        UPDATE "User"
           SET "coinBalance" = "coinBalance" + ${SIGNUP_BONUS_COINS}
         WHERE "id" = ${user.id}
        RETURNING "coinBalance"`;

      await tx.coinTransaction.create({
        data: {
          userId: user.id,
          type: 'ADMIN_ADJUSTMENT',
          amount: SIGNUP_BONUS_COINS,
          balanceAfter: coinBalance,
          note: 'SIGNUP_BONUS',
        },
      });
    });

    console.log(`Granted ${SIGNUP_BONUS_COINS} signup bonus coins to ${user.username}`);
  }
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedChatModels();
  await seedActionCosts();
  await seedCoinPackages();
  await seedSignupBonuses();
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
