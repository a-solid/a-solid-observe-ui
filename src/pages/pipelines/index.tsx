import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Topbar } from '../../components/Topbar'
import { Subtabs } from '../../components/Subtabs'
import { useNamespace } from '../../context/NamespaceContext'
import { usePipelines, useArchivePipeline } from '../../hooks/usePipelines'
import type { PipelineDto } from '../../api/types'
import './pipelines.css'

const ICON_VIEW = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
const ICON_EDIT = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
const ICON_ARCHIVE = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" /></svg>
const ICON_TIME = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
const ICON_GROOVY = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6" /></svg>

const CONFIG_SUBTABS = [
  { to: '/pipelines', label: 'Rules', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h7M6 8.5v7M18 8.5v7M8.5 18h7" /></svg> },
  { to: '/subscriptions', label: 'Subscription', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z" /><path d="M4 9h16M9 4v16" /></svg> },
  { to: '/pipelines/high-amount-order-alert/edit', label: 'Editor', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg> },
  { to: '/pipelines/high-amount-order-alert/versions', label: 'Versions', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v8M8 12h8" /><circle cx="12" cy="12" r="10" /></svg> },
]

type FilterStatus = 'all' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'

function statusColor(s: string): string {
  if (s === 'PUBLISHED') return 'var(--pipe-published)'
  if (s === 'DRAFT') return 'var(--pipe-draft)'
  return 'var(--pipe-archived)'
}

function PipeCard({ p }: { p: PipelineDto }) {
  const labelEntries = Object.entries(p.labels ?? {})
  const { namespace } = useNamespace()
  const archiveMutation = useArchivePipeline(namespace)

  const handleArchive = () => {
    archiveMutation.mutate(p.name, {
      onSuccess: () => toast.success(`Archived ${p.name}`),
    })
  }

  return (
    <article className={`pipe-card ${(p.status ?? 'draft').toLowerCase()}`}>
      <div className="pipe-card-head">
        <div className="pipe-card-title-block">
          <h3 className="pipe-card-name">{p.name}</h3>
          <p className="pipe-card-desc">{p.description || ' '}</p>
        </div>
        <span className="status-pill">
          <span className="dot" />
          {p.status}
        </span>
      </div>

      <div className="pipe-card-tags">
        <span className="tag groovy" title="Groovy rule">
          {ICON_GROOVY}Groovy
        </span>
        {labelEntries.map(([k, v]) => (
          <span key={k} className={`tag label ${k === 'team' ? 'team' : k === 'app' ? 'app' : ''}`}>
            <span className="lk">{k}</span>
            <span className="lv">{v}</span>
          </span>
        ))}
        {p.currentVersion != null && (
          <span className="tag ver">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>
            v{p.currentVersion}
          </span>
        )}
      </div>

      <div className="pipe-card-foot">
        <div className="pipe-card-foot-meta">
          <span className="foot-item">{ICON_TIME}{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '--'}</span>
        </div>
        <div className="pipe-card-actions">
          <Link to={`/pipelines/${p.name}/versions`} className="icon-btn" title="View">{ICON_VIEW}</Link>
          <Link to={`/pipelines/${p.name}/edit`} className="icon-btn" title="Edit">{ICON_EDIT}</Link>
          <button className="icon-btn" title="Archive" onClick={handleArchive}>{ICON_ARCHIVE}</button>
        </div>
      </div>
    </article>
  )
}

function Pipelines() {
  const { namespace } = useNamespace()
  const { data: pipelines = [], isLoading, isError, refetch } = usePipelines(namespace)
  const [status, setStatus] = useState<FilterStatus>('all')
  const [team, setTeam] = useState<string>('all')
  const [q, setQ] = useState('')

  const teams = useMemo(() => {
    const set = new Set<string>()
    pipelines.forEach((p) => {
      const t = p.labels?.team
      if (t) set.add(t)
    })
    return Array.from(set)
  }, [pipelines])

  const filtered = pipelines.filter((p) => {
    if (status !== 'all' && p.status !== status) return false
    if (team !== 'all' && p.labels?.team !== team) return false
    if (q) {
      const query = q.toLowerCase()
      const name = p.name?.toLowerCase() ?? ''
      const desc = p.description?.toLowerCase() ?? ''
      const app = p.labels?.app?.toLowerCase() ?? ''
      if (!name.includes(query) && !app.includes(query) && !desc.includes(query)) return false
    }
    return true
  })

  const counts = useMemo(() => {
    let pub = 0, draft = 0, arch = 0
    pipelines.forEach((p) => {
      if (p.status === 'PUBLISHED') pub++
      else if (p.status === 'DRAFT') draft++
      else arch++
    })
    return { pub, draft, arch, total: pipelines.length }
  }, [pipelines])

  const statusPillCls = (s: FilterStatus) =>
    `opt-pill${status === s ? ` active ${s === 'all' ? 'primary' : s.toLowerCase()}` : ''}`

  return (
    <>
      <Topbar />
      <Subtabs tabs={CONFIG_SUBTABS} />

      <main className="page pipelines-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Rules</h1>
            <p className="page-subtitle">
              <span className="num">{counts.total}</span> rules ·{' '}
              <span className="num" style={{ color: 'var(--pipe-published)', fontWeight: 600 }}>{counts.pub}</span> PUBLISHED ·{' '}
              <span className="num" style={{ color: 'var(--pipe-draft)', fontWeight: 600 }}>{counts.draft}</span> DRAFT ·{' '}
              <span className="num" style={{ color: 'var(--pipe-archived)' }}>{counts.arch}</span> ARCHIVED
            </p>
          </div>
          <Link className="btn-new" to={`/pipelines/new/edit`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
            New Rule
          </Link>
        </div>

        <div className="filters">
          <div className="filter-group">
            <span className="filter-label">Status</span>
            <div className="pill-group">
              <button className={statusPillCls('all')} onClick={() => setStatus('all')}>All</button>
              {(['PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((s) => (
                <button key={s} className={statusPillCls(s)} onClick={() => setStatus(s)}>
                  <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                  {s}
                </button>
              ))}
            </div>
          </div>

          {teams.length > 0 && (
            <div className="filter-group">
              <span className="filter-label">Team</span>
              <div className="pill-group">
                <button className={`opt-pill${team === 'all' ? ' active primary' : ''}`} onClick={() => setTeam('all')}>All</button>
                {teams.map((t) => (
                  <button key={t} className={`opt-pill${team === t ? ' active primary' : ''}`} onClick={() => setTeam(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filter-spacer" />

          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input type="text" placeholder="Search name / application..." value={q} onChange={(e) => setQ(e.target.value.trim())} />
          </div>
        </div>

        {isLoading && (
          <div className="list-footer">
            <span className="num">Loading pipelines...</span>
          </div>
        )}

        {isError && (
          <div className="list-footer">
            <span className="num" style={{ color: 'var(--severity-critical)' }}>Failed to load pipelines.</span>{' '}
            <button className="btn btn-ghost" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="grid">
              {filtered.map((p) => (
                <PipeCard key={`${p.namespace}/${p.name}`} p={p} />
              ))}
              {filtered.length === 0 && (
                <div className="list-footer" style={{ gridColumn: '1 / -1' }}>
                  <span className="num">No rules match the filters.</span>
                </div>
              )}
            </div>

            <div className="list-footer">
              <span className="num">{filtered.length}</span> rules
              {filtered.length !== pipelines.length && <> · filtered from <span className="num">{pipelines.length}</span> total</>}
            </div>
          </>
        )}
      </main>
    </>
  )
}

export default Pipelines
