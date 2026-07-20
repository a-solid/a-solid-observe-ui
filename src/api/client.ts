import axios from 'axios'
import { toast } from 'sonner'

const baseURL = import.meta.env.VITE_API_BASE ?? '/'

/**
 * JSON.parse reviver: integers beyond JS safe range (2^53-1) are quoted in the
 * raw response so they survive as strings.  Pattern: an integer with 16+ digits
 * (or > MAX_SAFE_INTEGER) in a JSON value position gets string-wrapped.
 */
const BIG_INT_RE = /(?<=[:\s,\[])\s*(-?\d{16,})(?=\s*[,\]\}])/g

function preserveBigInts(text: string): string {
  return text.replace(BIG_INT_RE, (_, digits) => {
    const n = BigInt(digits)
    if (n > BigInt(Number.MAX_SAFE_INTEGER) || n < BigInt(Number.MIN_SAFE_INTEGER)) {
      return `"${digits}"`
    }
    return digits
  })
}

export const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
  transformResponse: [
    (data) => {
      if (typeof data === 'string') {
        // Guard large int64 values before native JSON.parse
        return JSON.parse(preserveBigInts(data))
      }
      return data
    },
  ],
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
