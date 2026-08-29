import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

const appUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "")

export const api = axios.create({
  baseURL: `${appUrl}/api/v1`,
  withCredentials: true,
  // Port Vite dan Laravel berbeda sehingga request adalah cross-origin.
  // Axios perlu flag ini agar cookie XSRF-TOKEN juga menjadi header X-XSRF-TOKEN.
  withXSRFToken: true,
  headers: { Accept: "application/json" },
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
})

export const ensureCsrf = () => axios.get(`${appUrl}/sanctum/csrf-cookie`, {
  withCredentials: true,
  headers: { Accept: "application/json" },
})

type RetryableConfig = InternalAxiosRequestConfig & { _csrfRetried?: boolean }

api.interceptors.response.use(response => response, async (error: AxiosError) => {
  const config = error.config as RetryableConfig | undefined
  if (error.response?.status === 419 && config && !config._csrfRetried) {
    config._csrfRetried = true
    await ensureCsrf()
    return api.request(config)
  }
  if (error.response?.status === 401 && window.location.pathname !== "/login") {
    window.dispatchEvent(new CustomEvent("opera:unauthorized"))
  }
  return Promise.reject(error)
})

export function dataOf<T>(response: { data: ApiEnvelope<T> }): T {
  return response.data.data
}

export function apiMessage(error: unknown, fallback = "Terjadi kesalahan."): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as Partial<ApiEnvelope<unknown>> | undefined
    return body?.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

export default api
