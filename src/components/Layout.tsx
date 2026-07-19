import { Outlet } from 'react-router-dom'

/**
 * Root layout: the routed page is fully responsible for rendering its own
 * <Topbar> (since each demo's topbar differs) followed by its content.
 * This component just provides the <Outlet/> so nested routes can compose.
 */
export function Layout() {
  return <Outlet />
}
