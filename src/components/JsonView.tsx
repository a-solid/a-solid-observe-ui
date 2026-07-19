/**
 * Render a JS value as syntax-highlighted JSON (keys blue, strings green,
 * numbers amber, booleans red) — mirrors the demo's regex-based highlighting.
 */
export function JsonView({ value }: { value: unknown }) {
  const json = JSON.stringify(value, null, 2)
  // Tokenize line by line, matching "key": value pairs.
  const lines = json.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <Line key={i} line={line} />
      ))}
    </>
  )
}

function Line({ line }: { line: string }) {
  // Match `  "key": value,`
  const m = line.match(/^(\s*)"([^"]+)":\s+(.*)$/)
  if (m) {
    const [, indent, key, rest] = m
    return (
      <>
        {indent}
        <span className="k">"{key}"</span>:{' '}
        <Value raw={rest} />
        {'\n'}
      </>
    )
  }
  // Top-level opening/closing braces or array lines.
  return <>{line}{'\n'}</>
}

function Value({ raw }: { raw: string }) {
  const trailing = raw.endsWith(',') ? ',' : ''
  const v = trailing ? raw.slice(0, -1) : raw
  if (v === 'true' || v === 'false') return <><span className="b">{v}</span>{trailing}</>
  if (v === 'null') return <span className="n">{v}</span>
  if (v.startsWith('"')) return <span className="s">{v}</span>
  // number
  return <span className="n">{v}</span>
}
