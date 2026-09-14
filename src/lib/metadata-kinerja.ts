export const SATUAN_BELUM_TERSEDIA = 'Satuan belum tersedia pada sumber';
export const OUTPUT_BELUM_TERSEDIA = 'Output belum tersedia pada sumber';

const teksTerisi = (nilai: string | null | undefined) => nilai?.trim() || null;

export const teksSatuanKinerja = (nilai: string | null | undefined) =>
  teksTerisi(nilai) ?? SATUAN_BELUM_TERSEDIA;

export const teksOutputKinerja = (nilai: string | null | undefined) =>
  teksTerisi(nilai) ?? OUTPUT_BELUM_TERSEDIA;
