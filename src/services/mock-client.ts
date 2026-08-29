// Simulasi latency + galat acak jaringan untuk lapisan mock (Fase 0-5).
// Fase 6 menghapus pemakaian ini dari tiap *.service.ts saat isinya diganti
// axios sungguhan — tanda tangan fungsi service tidak berubah.
//
// Nonaktifkan galat/latency lewat .env: VITE_MOCK_LATENCY_MS=0

const LATENCY_MS = Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 250)
const ERROR_RATE = Number(import.meta.env.VITE_MOCK_ERROR_RATE ?? 0)

export class MockApiError extends Error {
  constructor(message = "Gagal memuat data (simulasi galat jaringan).") {
    super(message)
    this.name = "MockApiError"
  }
}

/** Bungkus setiap fungsi service dengan ini supaya komponen sudah terbiasa
 * menangani Promise + loading state sejak sekarang, sama seperti nanti
 * memanggil axios sungguhan. */
export async function mockRequest<T>(factory: () => T): Promise<T> {
  if (LATENCY_MS > 0) {
    await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
  }
  if (ERROR_RATE > 0 && Math.random() < ERROR_RATE) {
    throw new MockApiError()
  }
  return factory()
}
