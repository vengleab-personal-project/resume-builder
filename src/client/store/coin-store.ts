import { create } from 'zustand';
import { COIN_BALANCE_HEADER } from '@/shared/types/coins';

// Deliberately NOT wrapped in `persist`, unlike every other store in this app.
// A balance cached in localStorage is a number the user can edit; it must only
// ever arrive from the server, either from /api/coins/balance or from the
// X-Coin-Balance header on an AI response.
interface CoinState {
  balance: number | null;
  isLoading: boolean;

  topUpOpen: boolean;
  // Set when a 402 opened the modal, so the UI can pre-select a package that
  // actually covers the action the user was trying to run.
  requiredCoins: number | null;

  setBalance: (balance: number) => void;
  applyResponseHeaders: (response: Response) => void;
  refreshBalance: () => Promise<void>;
  openTopUp: (requiredCoins?: number | null) => void;
  closeTopUp: () => void;
}

export const useCoinStore = create<CoinState>()((set) => ({
  balance: null,
  isLoading: false,
  topUpOpen: false,
  requiredCoins: null,

  setBalance: (balance) => set({ balance }),

  applyResponseHeaders: (response) => {
    const header = response.headers.get(COIN_BALANCE_HEADER);
    if (header === null) return;

    const parsed = Number.parseInt(header, 10);
    if (Number.isFinite(parsed)) set({ balance: parsed });
  },

  refreshBalance: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/coins/balance', { cache: 'no-store' });
      if (!response.ok) return;

      const body = (await response.json()) as { balance?: number };
      if (typeof body.balance === 'number') set({ balance: body.balance });
    } catch {
      // A transient failure leaves the previous value; the badge renders a
      // placeholder rather than a wrong number.
    } finally {
      set({ isLoading: false });
    }
  },

  openTopUp: (requiredCoins = null) => set({ topUpOpen: true, requiredCoins }),
  closeTopUp: () => set({ topUpOpen: false, requiredCoins: null }),
}));

/**
 * Shared handling for the 402 every AI route can now return. Returns true when
 * the response was an insufficient-coins failure and the top-up modal has been
 * opened, so the caller can stop and show a real error instead of fabricating a
 * result.
 */
export async function handleInsufficientCoins(response: Response): Promise<boolean> {
  if (response.status !== 402) return false;

  const body = (await response.json().catch(() => ({}))) as {
    required?: number;
    balance?: number;
  };

  const store = useCoinStore.getState();
  if (typeof body.balance === 'number') store.setBalance(body.balance);
  store.openTopUp(typeof body.required === 'number' ? body.required : null);

  return true;
}
