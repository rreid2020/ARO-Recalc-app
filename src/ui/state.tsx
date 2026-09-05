/**
 * The whole of this tool's state.
 *
 * One register, one engagement name, one append-only action log — held in React
 * state and persisted to `localStorage`. There is no server, no database and no
 * sign-in, which is the point: an auditor can run this on an extract they are
 * not permitted to upload anywhere, and the client's file never leaves the
 * machine.
 *
 * That also sets the limits honestly. Two of the ARO Suite's invariants do not
 * and cannot apply here:
 *
 * - **§3, the authority model.** A single-purpose tool has one user, who owns
 *   everything in it. There is nothing to refuse a write against.
 * - **§7, role gating.** Preparer / reviewer / partner is a property of an
 *   engagement team, not of a calculator. The sign-off below records *that* a
 *   conclusion was reached and by whom; it does not enforce who may reach it.
 *
 * §2 does apply and is kept: the action log is only ever prepended to.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { RecalcRegister, emptyRecalcRegister } from '../core/recalc';
import { FIRST_STEP, resolveScreen } from './nav';

const STORE = 'aro-recalc-v2';

/** The default year end for a new register — a March year end, as the client's. */
const DEFAULT_FY_END = '2026-03-31';

export interface LogEntry {
  /** ISO timestamp. */
  at: string;
  action: string;
  detail: string;
}

/**
 * Where the user is and who they are.
 *
 * Genuine client state — README, "State management". It is persisted only so
 * that a reload lands back on the step the work was left on; nothing here is
 * an input to a figure. `userName` is the one exception, and it is not a
 * credential: it is the name written onto the variance conclusion and the
 * export, typed by whoever is signing.
 */
export interface UiState {
  screen: string;
  userName: string;
}

export interface AppState {
  /** The entity being recalculated. Appears on the export and its filename. */
  engagement: string;
  reg: RecalcRegister;
  /** Append-only — INVARIANTS §2. Newest first. */
  log: LogEntry[];
}

interface Persisted {
  state: AppState;
  ui: UiState;
}

function initialState(): AppState {
  return { engagement: '', reg: emptyRecalcRegister(DEFAULT_FY_END), log: [] };
}

function initialUi(): UiState {
  return { screen: FIRST_STEP, userName: '' };
}

/**
 * What was persisted, if anything usable was.
 *
 * A stored blob from an older shape is discarded rather than migrated. There is
 * no version of this tool whose figures are worth silently reinterpreting — a
 * half-understood register is worse than an empty one, because the exceptions
 * would read as cleared when they had merely been lost.
 */
function load(): Persisted {
  const fresh: Persisted = { state: initialState(), ui: initialUi() };
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return fresh;
    const blob = JSON.parse(raw) as Partial<Persisted> & Partial<AppState>;
    if (!blob || typeof blob !== 'object') return fresh;
    // Tolerate the flat shape this file wrote before the UI slice existed: the
    // register itself is unchanged, so there is nothing to reinterpret.
    const d = (blob.state ?? blob) as Partial<AppState>;
    if (!d.reg || !Array.isArray(d.reg.rows)) return fresh;
    const u = (blob.ui ?? {}) as Partial<UiState>;
    return {
      state: {
        engagement: typeof d.engagement === 'string' ? d.engagement : '',
        reg: { ...emptyRecalcRegister(DEFAULT_FY_END), ...d.reg },
        log: Array.isArray(d.log) ? d.log : [],
      },
      ui: {
        screen: resolveScreen(typeof u.screen === 'string' ? u.screen : ''),
        userName: typeof u.userName === 'string' ? u.userName : '',
      },
    };
  } catch {
    // Private window, storage disabled, or a corrupt blob. Start clean.
    return fresh;
  }
}

export interface Store {
  state: AppState;
  ui: UiState;
  /** Write to the register and record what was done. */
  set: (action: string, next: Partial<RecalcRegister>, detail?: string) => void;
  /** Move around, or say who is signing. Never logged — it changes no figure. */
  setUi: (next: Partial<UiState>) => void;
  setEngagement: (name: string) => void;
  /** Clear everything, including the log. Asks first, at the call site. */
  reset: () => void;
  /** True when the last persist failed — the screen says so rather than lying. */
  storageBlocked: boolean;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [{ state, ui }, setAll] = useState<Persisted>(load);
  const [storageBlocked, setBlocked] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ state, ui }));
      setBlocked(false);
    } catch {
      // Over quota, or storage is unavailable. The tool keeps working in
      // memory; the header says the work will not survive a reload.
      setBlocked(true);
    }
  }, [state, ui]);

  const set = useCallback((action: string, next: Partial<RecalcRegister>, detail = '') => {
    setAll((s) => ({
      ...s,
      state: {
        ...s.state,
        reg: { ...s.state.reg, ...next },
        log: [{ at: new Date().toISOString(), action, detail }, ...s.state.log],
      },
    }));
  }, []);

  const setUi = useCallback((next: Partial<UiState>) => {
    setAll((s) => ({ ...s, ui: { ...s.ui, ...next } }));
  }, []);

  const setEngagement = useCallback((engagement: string) => {
    setAll((s) => (s.state.engagement === engagement ? s : {
      ...s,
      state: {
        ...s.state,
        engagement,
        log: [
          { at: new Date().toISOString(), action: 'Set the engagement name', detail: engagement },
          ...s.state.log,
        ],
      },
    }));
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORE);
    } catch {
      /* nothing persisted to clear */
    }
    // The user name survives a reset. It identifies the person at the keyboard,
    // not the engagement, and asking them to type it again teaches nothing.
    setAll((s) => ({ state: initialState(), ui: { ...initialUi(), userName: s.ui.userName } }));
  }, []);

  const value = useMemo<Store>(
    () => ({ state, ui, set, setUi, setEngagement, reset, storageBlocked }),
    [state, ui, set, setUi, setEngagement, reset, storageBlocked],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside a StoreProvider');
  return s;
}

/** The register and a writer for it — what every screen actually wants. */
export function useRegister() {
  const { state, set } = useStore();
  return { reg: state.reg, set, engagement: state.engagement };
}
