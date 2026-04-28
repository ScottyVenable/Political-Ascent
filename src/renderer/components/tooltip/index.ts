/**
 * Tooltip module — barrel export.
 */
export {
  ExtendedTooltip,
  Term,
  registerTooltip,
  getTooltip,
  allTooltipIds,
  clearTooltips,
  type TooltipContent,
  type TooltipSection,
  type ModifierRow,
} from './ExtendedTooltip';
export { TermText } from './TermText';
export { findTermMatches, type TermMatch } from './registry';
