'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { EVIDENCE_TIERS, EVIDENCE_TIER_RANK, type EvidenceTier } from '@/lib/schema/vocabulary';

/**
 * The Evidence Threshold is a site-wide , not a page filter.
 *
 * Raising it toward `verified` dissolves speculative material everywhere at
 * once — AI-inferred genes, uncertain parent edges, unmeasured mutations — so a
 * reader can ask "show me only what is actually proven" and have the whole
 * registry answer consistently.
 *
 * It lives in an external store rather than component state so the preference
 * survives navigation, persists across sessions, and stays in step between tabs.
 */

const STORAGE_KEY = 'codeancestry:evidence-threshold';
const DEFAULT_TIER: EvidenceTier = 'inferred';

const isTier = (value: unknown): value is EvidenceTier =>
  typeof value === 'string' && (EVIDENCE_TIERS as readonly string[]).includes(value);

let current: EvidenceTier = DEFAULT_TIER;
let hydrated = false;
const listeners = new Set<() => void>();

function readStorage(): EvidenceTier {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTier(stored) ? stored : DEFAULT_TIER;
  } catch {
    // Private browsing or a blocked storage partition. The default stands.
    return DEFAULT_TIER;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  // Keep sibling tabs in step: the threshold is a reading posture, not a
  // per-window setting.
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    const next = isTier(event.newValue) ? event.newValue : DEFAULT_TIER;
    if (next === current) return;
    current = next;
    emit();
  };

  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}

function getSnapshot(): EvidenceTier {
  if (!hydrated) {
    hydrated = true;
    current = readStorage();
  }
  return current;
}

const getServerSnapshot = (): EvidenceTier => DEFAULT_TIER;

function write(tier: EvidenceTier) {
  if (tier === current) return;
  current = tier;
  try {
    window.localStorage.setItem(STORAGE_KEY, tier);
  } catch {
    // Non-persistent session; the in-memory value is still authoritative.
  }
  emit();
}

type ThresholdContext = {
  threshold: EvidenceTier;
  setThreshold: (tier: EvidenceTier) => void;
  /** True when the record's strongest evidence tier clears the threshold. */
  passes: (tier: EvidenceTier) => boolean;
  /** Number of tiers currently being suppressed. 0 means nothing is hidden. */
  suppressed: number;
};

const Context = createContext<ThresholdContext | null>(null);

export function EvidenceThresholdProvider({ children }: { children: React.ReactNode }) {
  const threshold = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setThreshold = useCallback((tier: EvidenceTier) => write(tier), []);

  const value = useMemo<ThresholdContext>(
    () => ({
      threshold,
      setThreshold,
      passes: (tier) => EVIDENCE_TIER_RANK[tier] >= EVIDENCE_TIER_RANK[threshold],
      suppressed: EVIDENCE_TIER_RANK[threshold],
    }),
    [threshold, setThreshold],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useEvidenceThreshold(): ThresholdContext {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useEvidenceThreshold must be used inside <EvidenceThresholdProvider>');
  }
  return context;
}
