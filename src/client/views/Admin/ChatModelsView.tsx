"use client";

import React from 'react';
import { Plus, Star, Trash2, Pencil } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { AI_PROVIDER_VALUES } from '@/shared/lib/validation/configSchemas';
import type { AiProviderKey } from '@/shared/types';
import { useChatModelsAdminLogic } from './useChatModelsAdminLogic';

const ChatModelsView: React.FC = () => {
  const { t } = useTranslations('admin');
  const {
    models,
    isLoading,
    isSaving,
    error,
    draft,
    editingId,
    startCreate,
    startEdit,
    cancelEdit,
    updateDraft,
    submitDraft,
    toggleActive,
    makeDefault,
    remove,
  } = useChatModelsAdminLogic();

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t.chatModels.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">{t.chatModels.description}</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} />
          {t.chatModels.addModel}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error === 'loadFailed' ? t.errors.loadFailed : t.errors.saveFailed}
        </div>
      )}

      {draft && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm space-y-1">
            <span className="text-slate-500 font-medium">{t.form.provider}</span>
            <select
              value={draft.provider}
              onChange={(e) => updateDraft({ provider: e.target.value as AiProviderKey })}
              className="w-full p-2 rounded-md border border-slate-200 text-sm"
            >
              {AI_PROVIDER_VALUES.map((provider) => (
                <option key={provider} value={provider}>
                  {t.providers[provider]}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm space-y-1">
            <span className="text-slate-500 font-medium">{t.form.modelId}</span>
            <input
              value={draft.modelId}
              onChange={(e) => updateDraft({ modelId: e.target.value })}
              placeholder="gemini-3.8-flash"
              className="w-full p-2 rounded-md border border-slate-200 text-sm font-mono"
            />
          </label>

          <label className="text-sm space-y-1">
            <span className="text-slate-500 font-medium">{t.form.displayName}</span>
            <input
              value={draft.displayName}
              onChange={(e) => updateDraft({ displayName: e.target.value })}
              className="w-full p-2 rounded-md border border-slate-200 text-sm"
            />
          </label>

          <label className="text-sm space-y-1">
            <span className="text-slate-500 font-medium">{t.form.sortOrder}</span>
            <input
              type="number"
              min={0}
              value={draft.sortOrder}
              onChange={(e) => updateDraft({ sortOrder: Number(e.target.value) || 0 })}
              className="w-full p-2 rounded-md border border-slate-200 text-sm"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => updateDraft({ isActive: e.target.checked })}
            />
            {t.form.active}
          </label>

          <div className="flex items-center justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {t.form.cancel}
            </button>
            <button
              type="button"
              onClick={submitDraft}
              disabled={isSaving || !draft.modelId.trim() || !draft.displayName.trim()}
              className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
            >
              {t.form.save}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">{t.chatModels.columns.displayName}</th>
              <th className="text-left font-medium px-4 py-2.5">{t.chatModels.columns.provider}</th>
              <th className="text-left font-medium px-4 py-2.5">{t.chatModels.columns.modelId}</th>
              <th className="text-left font-medium px-4 py-2.5">{t.chatModels.columns.sortOrder}</th>
              <th className="text-left font-medium px-4 py-2.5">{t.chatModels.columns.active}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {t.loading}
                </td>
              </tr>
            )}

            {!isLoading && models.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {t.chatModels.empty}
                </td>
              </tr>
            )}

            {models.map((model) => (
              <tr key={model.id} className={editingId === model.id ? 'bg-indigo-50/40' : undefined}>
                <td className="px-4 py-2.5 text-slate-800 font-medium">
                  <span className="flex items-center gap-2">
                    {model.displayName}
                    {model.isDefault && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-semibold uppercase tracking-wide">
                        {t.chatModels.defaultBadge}
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{t.providers[model.provider]}</td>
                <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{model.modelId}</td>
                <td className="px-4 py-2.5 text-slate-500">{model.sortOrder}</td>
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={model.isActive}
                    disabled={isSaving || model.isDefault}
                    onChange={() => toggleActive(model)}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title={t.chatModels.makeDefault}
                      onClick={() => makeDefault(model)}
                      disabled={isSaving || model.isDefault || !model.isActive}
                      className="p-1.5 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Star size={15} fill={model.isDefault ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      title={t.form.edit}
                      onClick={() => startEdit(model)}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      title={t.form.delete}
                      onClick={() => {
                        if (window.confirm(t.chatModels.confirmDelete)) void remove(model);
                      }}
                      disabled={isSaving || model.isDefault}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ChatModelsView;
