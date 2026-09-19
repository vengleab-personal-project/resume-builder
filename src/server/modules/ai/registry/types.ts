import type { AIProvider, AiActionKey, AiProviderKey } from '@/shared/types';

export interface ChatModelRecord {
  id: string;
  provider: AiProviderKey;
  modelId: string;
  displayName: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface ActionCostRecord {
  action: AiActionKey;
  // null = the inherited default for the action.
  chatModelId: string | null;
  coinCost: number;
}

export interface AiConfigSnapshot {
  chatModels: ChatModelRecord[];
  actionCosts: ActionCostRecord[];
  // True when the snapshot came from the static constants because Postgres
  // could not be read. Callers use it for logging only, never for pricing.
  isFallback: boolean;
}

export interface ResolvedChatModel {
  id: string | null;
  provider: AiProviderKey;
  // Lowercase wire value ('google'), kept for the client-facing aiConfig contract.
  wireProvider: AIProvider;
  modelId: string;
  displayName: string;
}

export interface ResolvedAiRequest {
  chatModel: ResolvedChatModel;
  cost: number;
}
