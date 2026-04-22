/**
 * Bloom's taxonomy types. Shared between Course, Lesson, and the inline
 * Bloom artifact component — defined once here so the rest of the app
 * imports a single canonical shape.
 */

export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create'

export const BLOOM_LEVELS: readonly BloomLevel[] = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
] as const

const BLOOM_LABELS: Record<BloomLevel, string> = {
  remember: 'Remember',
  understand: 'Understand',
  apply: 'Apply',
  analyze: 'Analyze',
  evaluate: 'Evaluate',
  create: 'Create',
}

export function formatBloomLabel(level: BloomLevel): string {
  return BLOOM_LABELS[level]
}

/** View mode for the inline Bloom artifact component. */
export type BloomView = 'level' | 'coverage'

/**
 * Systematic data object for the Bloom artifact. Produced by sample data,
 * lesson/course analysis, or an AI tool-call — whatever source, the shape
 * is the same so the artifact component stays a pure renderer.
 */
export type BloomArtifactData = {
  /** The primary cognitive level to highlight in "level" view. */
  level: BloomLevel
  /** Coverage percentages (0–100) per tier, used in "coverage" view.
   *  Omit for ambient marker-driven renders where only the current level
   *  matters (no coverage toggle is shown). */
  distribution?: Record<BloomLevel, number>
  /** Optional per-tier notes shown when a tier is clicked. */
  notes?: Partial<Record<BloomLevel, string>>
  /** Initial view to render. Defaults to 'level' at the component level. */
  defaultView?: BloomView
  /** Optional override for the coverage-view summary line. */
  summary?: string
  /** Title displayed above the artifact (e.g. course or lesson name). */
  title?: string
  /** Subtitle displayed below the title. */
  subtitle?: string
}
