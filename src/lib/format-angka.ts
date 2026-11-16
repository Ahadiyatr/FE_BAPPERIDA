export const persen1 = (n: number) =>
  `${n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

export const persen2 = (n: number) =>
  `${n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
