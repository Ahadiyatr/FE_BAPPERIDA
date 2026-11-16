const PALET = [
  'bg-sky-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-orange-600',
  'bg-teal-600',
  'bg-pink-600',
  'bg-lime-700',
  'bg-indigo-600',
  'bg-rose-700',
  'bg-cyan-700',
] as const;

export function warnaBidang(
  urutanBidang: readonly { id: number }[],
  bidangId: number,
): string {
  const i = urutanBidang.findIndex(b => b.id === bidangId);
  return i < 0 ? 'bg-slate-400' : PALET[i % PALET.length];
}
