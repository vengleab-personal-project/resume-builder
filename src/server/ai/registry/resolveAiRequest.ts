import 'server-only';
import type { AiAction } from '@/server/db/generated/prisma';
import { HttpError } from '@/server/auth/guards';
import { FALLBACK_CHAT_MODELS } from '@/shared/config/constants';
import { getActionCost } from './actionCostService';
import { findActiveChatModel, getDefaultChatModel, toDbProvider, toWireProvider } from './chatModelService';
import type { ResolvedAiRequest, ResolvedChatModel } from './types';

export interface ResolveAiRequestInput {
  action: AiAction;
  // Lowercase wire provider as sent by the client ('google' / 'openai').
  provider?: string | null;
  modelId?: string | null;
  // Reject an unknown/inactive model instead of silently substituting the default.
  strict?: boolean;
}

// Last resort when the registry is empty AND the static fallback list somehow is
// too. Returning a model here is still safer than throwing, because the provider
// SDK will reject an unknown id anyway.
function hardcodedFallbackModel(): ResolvedChatModel {
  const first = FALLBACK_CHAT_MODELS[0];
  return {
    id: null,
    provider: first.provider,
    wireProvider: toWireProvider(first.provider),
    modelId: first.modelId,
    displayName: first.displayName,
  };
}

/**
 * The single seam every AI route goes through. It returns both the model that
 * will actually be invoked and what that invocation costs, so the coin system
 * can never charge for a model other than the one that ran.
 */
export async function resolveAiRequest({
  action,
  provider,
  modelId,
  strict = false,
}: ResolveAiRequestInput): Promise<ResolvedAiRequest> {
  const dbProvider = toDbProvider(provider);

  let chatModel = await findActiveChatModel(modelId, dbProvider);

  if (!chatModel && modelId && strict) {
    throw new HttpError(400, 'INVALID_INPUT', `Model "${modelId}" is not available`);
  }

  if (!chatModel) {
    chatModel = (await getDefaultChatModel(dbProvider)) ?? hardcodedFallbackModel();
  }

  const cost = await getActionCost(action, chatModel.modelId);

  return { chatModel, cost };
}
