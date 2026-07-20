import axios from 'axios'
import { toast } from 'sonner'

const baseURL = import.meta.env.VITE_API_BASE ?? '/'

/**
 * State-machine based big-int preserver.  Walks the raw JSON text char-by-char,
 * tracking whether we are inside a string.  Only quotes integers that appear at
 * JSON value positions — never touches numbers inside string content (e.g.
 * definitionJson payloads).
 */
function preserveBigInts(text: string): string {
  const out: string[] = []
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (escaped) {
      out.push(ch)
      escaped = false
      continue
    }

    if (inString) {
      if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      out.push(ch)
      continue
    }

    // Outside a string — look for numbers
    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      let num = ch
      let j = i + 1
      while (j < text.length && text[j] >= '0' && text[j] <= '9') {
        num += text[j]
        j++
      }
      if (num.length >= 16) {
        const n = BigInt(num)
        if (n > BigInt(Number.MAX_SAFE_INTEGER) || n < BigInt(Number.MIN_SAFE_INTEGER)) {
          out.push('"', num, '"')
          i = j - 1
          continue
        }
      }
      out.push(num)
      i = j - 1
      continue
    }

    if (ch === '"') {
      inString = true
    }
    out.push(ch)
  }

  return out.join('')
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
