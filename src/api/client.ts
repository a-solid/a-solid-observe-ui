import axios from 'axios'
import { toast } from 'sonner'

const baseURL = import.meta.env.VITE_API_BASE ?? '/'

export const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

// Response interceptor: unwrap ApiResponse<T>.data / PageResponse<T>.data
client.interceptors.response.use(
  (res) => {
    // If response has a `data` wrapper from the backend ApiResponse envelope,
    // unwrap it so callers receive the business payload directly.
    // Page responses have { data, page } — we keep both.
    const body = res.data
    if (body && typeof body === 'object' && 'data' in body) {
      // PageResponse shape: { data: [...], page: { page, size, total } }
      if ('page' in body) {
        return { ...res, data: body }
      }
      // ApiResponse shape: { data: ... }
      return { ...res, data: body.data }
    }
    return res
  },
  (error) => {
    const msg =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Network error'
    toast.error(msg)
    return Promise.reject(error)
  },
)
