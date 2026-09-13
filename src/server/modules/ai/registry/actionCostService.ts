import 'server-only';
import type { AiAction } from '@/server/db/generated/prisma';
import { DEFAULT_ACTION_COIN_COST, FALLBACK_ACTION_COSTS } from '@/shared/config/constants';
import { getAiConfigSnapshot } from './aiConfigCache';

function staticCost(action: AiAction): number {
  return FALLBACK_ACTION_COSTS[action] ?? DEFAULT_ACTION_COIN_COST;
}

function normalize(value: number, action: AiAction): number {
  // 0 is a legitimate "free action" signal, so only negatives and non-integers
  // (a hand-edited row, a NaN out of a broken cast) are rejected.
  if (!Number.isInteger(value) || value < 0) {
    console.error(`Invalid coin cost ${value} for ${action}; using static default.`);
    return staticCost(action);
  }
  return value;
}

/**
 * Frozen contract consumed by the coin system (Workstream C).
 *
 * Returns a non-negative integer and never throws: an unknown model, an empty
 * registry or an unreachable Postgres all degrade to the static default rather
 * than failing the AI request that is asking what it costs.
 */
export async function getActionCost(action: AiAction, modelId: string): Promise<number> {
  try {
    const snapshot = await getAiConfigSnapshot();

    const model = snapshot.chatModels.find((candidate) => candidate.modelId === modelId);
    if (!model) {
      console.warn(`Unknown model "${modelId}" for ${action}; falling back to the action default.`);
    }

    const override = model
      ? snapshot.actionCosts.find(
          (cost) => cost.action === action && cost.chatModelId === model.id
        )
      : undefined;

    const inherited = snapshot.actionCosts.find(
      (cost) => cost.action === action && cost.chatModelId === null
    );

    return normalize(override?.coinCost ?? inherited?.coinCost ?? staticCost(action), action);
  } catch (error) {
    console.error(`getActionCost failed for ${action}/${modelId}:`, error);
    return staticCost(action);
  }
}

export interface ActionCostMatrixEntry {
  action: AiAction;
  defaultCost: number;
  overrides: { chatModelId: string; coinCost: number }[];
}

export async function getActionCostMatrix(): Promise<ActionCostMatrixEntry[]> {
  const snapshot = await getAiConfigSnapshot();
  const actions: AiAction[] = ['PARSE_RESUME', 'REFINE_RESUME', 'EVALUATE_RESUME'];

  return actions.map((action) => {
    const rows = snapshot.actionCosts.filter((cost) => cost.action === action);
    const inherited = rows.find((cost) => cost.chatModelId === null);

    return {
      action,
      defaultCost: inherited ? normalize(inherited.coinCost, action) : staticCost(action),
      overrides: rows
        .filter((cost): cost is typeof cost & { chatModelId: string } => cost.chatModelId !== null)
        .map((cost) => ({ chatModelId: cost.chatModelId, coinCost: cost.coinCost })),
    };
  });
}
