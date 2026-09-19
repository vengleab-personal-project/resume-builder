"use client";

import React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from '@/client/hooks/useTranslations';
import { FALLBACK_ACTION_COSTS } from '@/shared/config/constants';
import type { AiActionKey } from '@/shared/types';
import { ACTIONS, useActionCostsAdminLogic } from './useActionCostsAdminLogic';

interface CostCellProps {
  value: number | null;
  placeholder: number;
  disabled: boolean;
  onCommit: (coinCost: number) => void;
  onClear?: () => void;
}

const CostCell: React.FC<CostCellProps> = ({ value, placeholder, disabled, onCommit, onClear }) => {
  const [draft, setDraft] = React.useState(value === null ? '' : String(value));

  React.useEffect(() => {
    setDraft(value === null ? '' : String(value));
  }, [value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      if (value !== null) onClear?.();
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed === value) {
      setDraft(value === null ? '' : String(value));
      return;
    }
    onCommit(parsed);
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        value={draft}
        placeholder={String(placeholder)}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className="w-20 p-1.5 rounded-md border border-slate-200 text-sm text-right disabled:bg-slate-50"
      />
      {onClear && value !== null && (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-slate-100"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};

const ActionCostsView: React.FC = () => {
  const { t } = useTranslations('admin');
  const { models, isLoading, isSaving, error, findCost, setCost, clearOverride } =
    useActionCostsAdminLogic();

  const defaultFor = (action: AiActionKey): number =>
    findCost(action, null)?.coinCost ?? FALLBACK_ACTION_COSTS[action];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t.actionCosts.title}</h2>
        <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">{t.actionCosts.description}</p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error === 'loadFailed' ? t.errors.loadFailed : t.errors.saveFailed}
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-6 text-center text-slate-400 text-sm">
          {t.loading}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">{t.actionCosts.action}</th>
                <th className="text-left font-medium px-4 py-2.5">{t.actionCosts.defaultColumn}</th>
                {models.map((model) => (
                  <th key={model.id} className="text-left font-medium px-4 py-2.5 whitespace-nowrap">
                    {model.displayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ACTIONS.map((action) => (
                <tr key={action}>
                  <td className="px-4 py-2.5 text-slate-800 font-medium whitespace-nowrap">
                    {t.actions[action]}
                  </td>
                  <td className="px-4 py-2.5">
                    <CostCell
                      value={findCost(action, null)?.coinCost ?? null}
                      placeholder={FALLBACK_ACTION_COSTS[action]}
                      disabled={isSaving}
                      onCommit={(coinCost) => setCost(action, null, coinCost)}
                    />
                  </td>
                  {models.map((model) => {
                    const override = findCost(action, model.id);
                    return (
                      <td key={model.id} className="px-4 py-2.5">
                        <CostCell
                          value={override?.coinCost ?? null}
                          placeholder={defaultFor(action)}
                          disabled={isSaving}
                          onCommit={(coinCost) => setCost(action, model.id, coinCost)}
                          onClear={() => clearOverride(action, model.id)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {models.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-400 border-t border-slate-100">
              {t.actionCosts.noModels}
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400">{t.actionCosts.inherited}</p>
    </section>
  );
};

export default ActionCostsView;
