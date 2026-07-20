import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { namespaceApi } from '../api/namespace'
import type { NamespaceDto } from '../api/types'

const STORAGE_KEY = 'a-solid-namespace'

interface NamespaceContextValue {
  namespaces: NamespaceDto[]
  namespace: string
  setNamespace: (name: string) => void
  loading: boolean
}

const NamespaceContext = createContext<NamespaceContextValue>({
  namespaces: [],
  namespace: '',
  setNamespace: () => {},
  loading: true,
})

export function NamespaceProvider({ children }: { children: ReactNode }) {
  const [namespaces, setNamespaces] = useState<NamespaceDto[]>([])
  const [namespace, setNamespaceState] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    namespaceApi
      .list()
      .then((list) => {
        setNamespaces(list)
        if (list.length > 0) {
          setNamespaceState((prev) => {
            if (prev && list.some((n) => n.name === prev)) return prev
            const first = list[0].name
            localStorage.setItem(STORAGE_KEY, first)
            return first
          })
        }
      })
      .catch(() => {
        // Namespace list fetch failed — keep whatever was in localStorage
      })
      .finally(() => setLoading(false))
  }, [])

  const setNamespace = useCallback((name: string) => {
    localStorage.setItem(STORAGE_KEY, name)
    setNamespaceState(name)
  }, [])

  return (
    <NamespaceContext.Provider value={{ namespaces, namespace, setNamespace, loading }}>
      {children}
    </NamespaceContext.Provider>
  )
}

export function useNamespace() {
  return useContext(NamespaceContext)
}
