import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Layout } from './components/Layout'
import { NamespaceProvider } from './context/NamespaceContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
})

// Page-level code splitting (route-based) for performance.
const Dashboard = lazy(() => import('./pages/dashboard'))
const Alerts = lazy(() => import('./pages/alerts'))
const AlertDetail = lazy(() => import('./pages/alert-detail'))
const Executions = lazy(() => import('./pages/executions'))
const FailedExecutions = lazy(() => import('./pages/failed'))
const Pipelines = lazy(() => import('./pages/pipelines'))
const PipelineEditor = lazy(() => import('./pages/pipeline-editor'))
const Versions = lazy(() => import('./pages/versions'))
const Subscriptions = lazy(() => import('./pages/subscriptions'))
const SubscriptionEditor = lazy(() => import('./pages/subscription-editor'))
const Demo = lazy(() => import('./pages/demo'))

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/alerts', element: <Alerts /> },
      { path: '/alerts/:id', element: <AlertDetail /> },
      { path: '/executions', element: <Executions /> },
      { path: '/executions/failed', element: <FailedExecutions /> },
      { path: '/pipelines', element: <Pipelines /> },
      { path: '/pipelines/:id/edit', element: <PipelineEditor /> },
      { path: '/pipelines/:id/versions', element: <Versions /> },
      { path: '/subscriptions', element: <Subscriptions /> },
      { path: '/subscriptions/:id/edit', element: <SubscriptionEditor /> },
      { path: '/demo', element: <Demo /> },
      { path: '*', element: <Dashboard /> },
    ],
  },
])

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NamespaceProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-center" richColors closeButton />
      </NamespaceProvider>
    </QueryClientProvider>
  )
}

export default App
