import 'server-only';
import { AI_PROVIDERS } from '@/shared/config/constants';
import type { AIProvider, AiProviderKey, ChatModelOption } from '@/shared/types';
import { getAiConfigSnapshot } from './aiConfigCache';
import type { ChatModelRecord, ResolvedChatModel } from './types';

const WIRE_TO_DB: Record<AIProvider, AiProviderKey> = {
  [AI_PROVIDERS.GOOGLE]: 'GOOGLE',
  [AI_PROVIDERS.OPENAI]: 'OPENAI',
};

const DB_TO_WIRE: Record<AiProviderKey, AIProvider> = {
  GOOGLE: AI_PROVIDERS.GOOGLE,
  OPENAI: AI_PROVIDERS.OPENAI,
};

// The client and every persisted localStorage aiConfig speak lowercase; the DB
// enum is uppercase. Mapping lives here and nowhere else.
export function toDbProvider(provider: string | null | undefined): AiProviderKey | null {
  if (!provider) return null;
  return WIRE_TO_DB[provider.toLowerCase() as AIProvider] ?? null;
}

export function toWireProvider(provider: AiProviderKey): AIProvider {
  return DB_TO_WIRE[provider];
}

function toResolved(record: ChatModelRecord): ResolvedChatModel {
  return {
    id: record.id.startsWith('fallback:') ? null : record.id,
    provider: record.provider,
    wireProvider: toWireProvider(record.provider),
    modelId: record.modelId,
    displayName: record.displayName,
  };
}

export async function listActiveChatModels(): Promise<ChatModelRecord[]> {
  const snapshot = await getAiConfigSnapshot();
  return snapshot.chatModels.filter((model) => model.isActive);
}

export async function listChatModelOptions(): Promise<ChatModelOption[]> {
  const models = await listActiveChatModels();
  return models.map((model) => ({
    id: model.id,
    provider: toWireProvider(model.provider),
    modelId: model.modelId,
    displayName: model.displayName,
    isDefault: model.isDefault,
    sortOrder: model.sortOrder,
  }));
}

export async function getDefaultChatModel(
  provider?: AiProviderKey | null
): Promise<ResolvedChatModel | null> {
  const active = await listActiveChatModels();
  if (active.length === 0) return null;

  const scoped = provider ? active.filter((model) => model.provider === provider) : active;
  const pool = scoped.length > 0 ? scoped : active;

  return toResolved(pool.find((model) => model.isDefault) ?? pool[0]);
}

// The single allow-list gate. Every path that hands a model id to a provider SDK
// goes through this — a widened AIModel type means nothing else stands between a
// request body and the vendor API.
export async function findActiveChatModel(
  modelId: string | null | undefined,
  provider?: AiProviderKey | null
): Promise<ResolvedChatModel | null> {
  if (!modelId) return null;

  const active = await listActiveChatModels();
  const match = active.find(
    (model) => model.modelId === modelId && (!provider || model.provider === provider)
  );

  return match ? toResolved(match) : null;
}

export async function isChatModelAllowed(
  modelId: string,
  provider?: AiProviderKey | null
): Promise<boolean> {
  return (await findActiveChatModel(modelId, provider)) !== null;
}
