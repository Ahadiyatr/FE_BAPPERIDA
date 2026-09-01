export function MelebihiTargetBadge({ realisasi, target }: { realisasi: number; target: number }) {
  if (target <= 0 || realisasi <= target) return null

  return (
    <span className="inline-flex rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
      Melebihi target
    </span>
  )
}
