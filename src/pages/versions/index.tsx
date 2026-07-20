import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { defaultHighlightStyle, syntaxHighlighting, StreamLanguage, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { MergeView } from '@codemirror/merge'
import { groovy } from '@codemirror/legacy-modes/mode/groovy'
import { toast } from 'sonner'
import { Topbar } from '../../components/Topbar'
import { useNamespace } from '../../context/NamespaceContext'
import { useVersions, usePublishVersion, useArchiveVersion } from '../../hooks/useVersions'
import type { VersionDto } from '../../api/types'
import './versions.css'

const groovyHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#C084FC', fontWeight: '600' },
  { tag: tags.atom, color: '#F472B6' },
  { tag: tags.number, color: '#FBBF24' },
  { tag: tags.string, color: '#86EFAC' },
  { tag: tags.comment, color: '#64748B', fontStyle: 'italic' },
  { tag: tags.variableName, color: '#FBA74D' },
  { tag: tags.function(tags.variableName), color: '#60A5FA' },
  { tag: tags.propertyName, color: '#94A3B8' },
  { tag: tags.punctuation, color: '#94A3B8' },
  { tag: tags.operator, color: '#C084FC' },
])

const mergeTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent', color: '#CBD5E1', fontSize: '12.5px', fontFamily: "'Fira Code', monospace" },
  '&.cm-focused': { outline: 'none' },
  '.cm-content': { caretColor: '#3B82F6', padding: '12px 14px' },
  '.cm-gutters': { backgroundColor: 'rgba(255,255,255,0.02)', color: '#475569', border: 'none', borderRight: '1px solid rgba(255,255,255,0.06)' },
  '.cm-activeLine': { backgroundColor: 'rgba(59, 130, 246, 0.06)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(59, 130, 246, 0.10)', color: '#94A3B8' },
  '.cm-cursor': { borderLeftColor: '#3B82F6' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(59, 130, 246, 0.22) !important' },
  '.cm-mergeView': { background: 'transparent' },
  '.cm-mergeView-editor': { background: 'transparent' },
  '.cm-deletedChunk': { background: 'rgba(248, 113, 113, 0.10)', borderLeft: '2px solid rgba(248, 113, 113, 0.6)' },
  '.cm-insertedChunk': { background: 'rgba(134, 239, 172, 0.10)', borderLeft: '2px solid rgba(134, 239, 172, 0.6)' },
  '.cm-deletedChunkGutter': { background: 'rgba(248, 113, 113, 0.08)' },
  '.cm-insertedChunkGutter': { background: 'rgba(134, 239, 172, 0.08)' },
  '.cm-changedLine, .cm-changedGutter': { background: 'rgba(59, 130, 246, 0.10)' },
  '.cm-mergeGap': { background: 'rgba(255,255,255,0.02)' },
  '.cm-gutterElement': { color: '#475569', padding: '0 8px 0 6px' },
  '.cm-gutter .cm-insertedLineMarker': { color: '#86EFAC' },
  '.cm-gutter .cm-deletedLineMarker': { color: '#F87171' },
})

const sharedExtensions = [
  StreamLanguage.define(groovy),
  syntaxHighlighting(groovyHighlightStyle),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  mergeTheme,
  EditorView.lineWrapping,
  EditorState.readOnly.of(true),
]

function Versions() {
  const { name: urlName } = useParams<{ name?: string }>()
  const { namespace } = useNamespace()
  const pipelineName = urlName ?? ''

  const { data: versions = [], isLoading } = useVersions(namespace, pipelineName)
  const publishMutation = usePublishVersion(namespace, pipelineName)
  const archiveMutation = useArchiveVersion(namespace, pipelineName)

  const hostRef = useRef<HTMLDivElement>(null)
  const mergeRef = useRef<MergeView | null>(null)
  const [mode, setMode] = useState<'merge' | 'side'>('side')
  const [selected, setSelected] = useState<string>('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Parse definitionJson from a version to extract scriptSource
  const getScript = (v: VersionDto | undefined): string => {
    if (!v?.definitionJson) return '// No definition available'
    try {
      const def = JSON.parse(v.definitionJson) as { nodes?: { scriptSource?: string }[] }
      return def.nodes?.[0]?.scriptSource ?? '// No script in definition'
    } catch {
      return '// Failed to parse definitionJson'
    }
  }

  // Map versions to labels for selection
  const versionLabels = useMemo(() => {
    return versions.map((v) => ({ label: `v${v.version}`, version: v }))
  }, [versions])

  // Selected version object
  const selectedVersion = versionLabels.find((vl) => vl.label === selected)?.version

  // Latest version for "b" side (last in array — API returns chronological order)
  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null

  // Scripts from definitionJson (real data)
  const oldScript = getScript(selectedVersion)
  const newScript = getScript(latestVersion)

  // Auto-select first version
  useEffect(() => {
    if (versionLabels.length > 0 && !selected) {
      setSelected(versionLabels[0].label)
    }
  }, [versionLabels, selected])

  const buildMerge = (m: 'merge' | 'side', oldS: string, newS: string) => {
    if (!hostRef.current) return
    mergeRef.current?.destroy()
    const mv = new MergeView({
      a: { doc: oldS, extensions: sharedExtensions },
      b: { doc: newS, extensions: sharedExtensions },
      orientation: 'a-b',
      revertControls: 'a-to-b',
      gutter: true,
      highlightChanges: true,
      collapseUnchanged: { minSize: 4, margin: 8 },
    })
    hostRef.current.innerHTML = ''
    hostRef.current.appendChild(mv.dom)
    mergeRef.current = mv

    if (m === 'merge') {
      const aEditor = hostRef.current.querySelector('.cm-mergeView .cm-merge-a') as HTMLElement | null
      if (aEditor) aEditor.style.display = 'none'
      const gap = hostRef.current.querySelector('.cm-mergeView .cm-merge-gap') as HTMLElement | null
      if (gap) gap.style.display = 'none'
    }
  }

  useEffect(() => {
    buildMerge(mode, oldScript, newScript)
    return () => { mergeRef.current?.destroy(); mergeRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, oldScript, newScript])

  const publishedVersion = versions.find((v: VersionDto) => v.status === 'PUBLISHED')
  const draftVersion = versions.find((v: VersionDto) => v.status === 'DRAFT')

  const handlePublish = (v: VersionDto) => {
    publishMutation.mutate({ version: v.version }, {
      onSuccess: () => toast.success(`Published v${v.version}`),
    })
  }

  const handleArchive = (v: VersionDto) => {
    archiveMutation.mutate(v.version, {
      onSuccess: () => toast.success(`Archived v${v.version}`),
    })
  }

  return (
    <>
      <Topbar showNamespace={false} />

      <main className="page versions-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              Version Management
              <span className="pipeline-name-tag">{namespace}/{pipelineName}</span>
            </h1>
            <p className="page-subtitle">
              <span className="num">{versions.length}</span> versions
              {publishedVersion && (
                <> · currently published <span className="mono" style={{ color: 'var(--pipe-published)', fontWeight: 600 }}>v{publishedVersion.version}</span></>
              )}
              {draftVersion && (
                <> · pending publish <span className="mono" style={{ color: 'var(--pipe-draft)', fontWeight: 600 }}>v{draftVersion.version}</span></>
              )}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="list-footer">
            <span className="num">Loading versions...</span>
          </div>
        )}

        {!isLoading && versions.length > 0 && (
          <div className="version-grid">
            <aside className="timeline-pane">
              <p className="timeline-head">Version Timeline</p>
              <div className="version-list">
                {versionLabels.map(({ label, version: item }) => {
                  const isCurrent = item.status === 'PUBLISHED'
                  return (
                    <div
                      key={item.version}
                      className={`version-item ${item.status?.toLowerCase()}${isCurrent ? ' current' : ''}${selected === label ? ' selected' : ''}`}
                      onClick={() => { setSelected(label); toast.success(`Selected ${label} for diff comparison`) }}
                    >
                      <div className="version-row">
                        <span className="version-num">{label}</span>
                        <span className={`version-status-tag ${isCurrent ? 'current' : item.status?.toLowerCase()}`}>
                          {item.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="version-meta">
                        {item.publishedBy ? `by ${item.publishedBy}` : ''}
                        {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="diff-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                Selected {selected} for diff
              </div>
            </aside>

            <section className="diff-pane">
              <div className="diff-head">
                <div>
                  <h2 className="diff-title">
                    <span className="diff-from">{selected}</span>
                    <span className="diff-arrow">→</span>
                    <span className="diff-to">
                      {latestVersion ? `v${latestVersion.version}` : '--'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>scriptSource diff</span>
                  </h2>
                  <div className="diff-meta" style={{ marginTop: 6 }}>{selectedVersion?.definitionHash ? `hash: ${selectedVersion.definitionHash.slice(0, 12)}...` : ''}</div>
                </div>
              </div>

              <div className="diff-toolbar">
                <div className="diff-toolbar-left">
                  <span className="diff-side-head">{selected} → {latestVersion ? `v${latestVersion.version}` : '--'} · nodes[0].scriptSource</span>
                </div>
                <div className="diff-mode-switch">
                  <button className={`mode-btn${mode === 'merge' ? ' active' : ''}`} onClick={() => setMode('merge')}>Merge View</button>
                  <button className={`mode-btn${mode === 'side' ? ' active' : ''}`} onClick={() => setMode('side')}>Side-by-Side</button>
                </div>
              </div>
              <div className="diff-body">
                <div className="merge-host" ref={hostRef} />
              </div>

              <div className="diff-actions">
                <div style={{ display: 'flex', gap: 8 }}>
                  {draftVersion && (
                    <>
                      <button className="btn btn-warn" onClick={() => handleArchive(draftVersion)}>Archive v{draftVersion.version}</button>
                      <button className="btn btn-primary" onClick={() => handlePublish(draftVersion)} style={{ textDecoration: 'none' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                        Publish v{draftVersion.version}
                      </button>
                    </>
                  )}
                  {!draftVersion && (
                    <Link className="btn btn-primary" to={`/pipelines/${pipelineName}/edit`} style={{ textDecoration: 'none' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                      Edit Pipeline
                    </Link>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {!isLoading && versions.length === 0 && (
          <div className="list-footer">
            <span className="num">No versions yet. Save a version from the editor.</span>
          </div>
        )}
      </main>

      {/* Confirm overlay */}
      <div
        className={`confirm-overlay${confirmOpen ? ' show' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setConfirmOpen(false) }}
      >
        <div className="confirm-modal">
          <div className="confirm-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2zm0 6l6.5 12h-13L12 8zm-1 4v4h2v-4h-2zm0 5v2h2v-2h-2z" /></svg>
          </div>
          <h3 className="confirm-title">Confirm rollback?</h3>
          <p className="confirm-desc">This will create a new version based on the selected definition and auto-publish.</p>
          <div className="confirm-actions">
            <button className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => { setConfirmOpen(false); toast.success('Rollback submitted') }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
              Confirm Rollback
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Versions
