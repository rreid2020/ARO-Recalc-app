/**
 * Step id → screen.
 *
 * One map, keyed by the same ids `ui/nav.ts` lists and `core/recalc.ts` names
 * when it says which step resolves an exception. `recalc-help` is extra — it is
 * not a numbered workflow step. Keeping the rest in one vocabulary is what lets
 * a "Resolve" button on Exceptions & clearance be a `setUi({ screen })` rather
 * than a routing decision.
 */

import React from 'react';
import { FIRST_STEP } from '../nav';
import {
  RecalcCompare,
  RecalcExceptions,
  RecalcImport,
  RecalcSource,
  RecalcVariance,
  Recalculation,
} from './recalc';
import {
  RecalcAccretion,
  RecalcAssumptions,
  RecalcAudit,
  RecalcRaw,
} from './recalcMore';
import { RecalcHelp } from './help';

const SCREENS: Record<string, () => React.JSX.Element> = {
  'recalc-import': RecalcImport,
  'recalc-source': RecalcSource,
  recalculation: Recalculation,
  'recalc-accretion': RecalcAccretion,
  'recalc-compare': RecalcCompare,
  'recalc-exceptions': RecalcExceptions,
  'recalc-variance': RecalcVariance,
  'recalc-audit': RecalcAudit,
  'recalc-assumptions': RecalcAssumptions,
  'recalc-raw': RecalcRaw,
  'recalc-help': RecalcHelp,
};

export function Screen({ screen }: { screen: string }) {
  const Body = SCREENS[screen] ?? SCREENS[FIRST_STEP];
  return <Body />;
}
