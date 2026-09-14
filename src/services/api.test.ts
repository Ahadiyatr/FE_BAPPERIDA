// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import { apiMessage } from "./api"

describe("apiMessage", () => {
  it("menampilkan seluruh detail validasi file dari backend", () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          success: false,
          message: "Data tidak valid.",
          errors: {
            "dokumens.1": ["Format dokumen ke-2 tidak didukung."],
            "dokumens.2": ["Ukuran setiap dokumen maksimal 20 MB."],
          },
        },
      },
    }

    expect(apiMessage(error)).toBe(
      "Format dokumen ke-2 tidak didukung. Ukuran setiap dokumen maksimal 20 MB.",
    )
  })
})
