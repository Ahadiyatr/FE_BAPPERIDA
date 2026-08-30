/** Token warna untuk nilai yang harus dipakai JavaScript/SVG (chart dan dialog). */
export const DESIGN_COLOR = {
  brand: "var(--color-brand)", brandStrong: "var(--color-brand-strong)",
  success: "var(--color-status-success)", warning: "var(--color-status-warning)",
  danger: "var(--color-status-danger)", neutral: "var(--color-status-neutral)",
  surface: "var(--color-surface-subtle)", border: "var(--color-border-subtle)", textMuted: "var(--color-text-muted)",
} as const

export const CHART_PALETTE = [
  "var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)",
  "var(--color-chart-5)", "var(--color-chart-6)", "var(--color-chart-7)",
] as const
