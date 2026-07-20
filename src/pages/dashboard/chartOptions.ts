import type { EChartsOption } from 'echarts'
import type { TimeseriesPointDto, ExecutionTimeseriesPointDto } from '../../api/types'

const tooltipBase = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderColor: '#DBEAFE',
  borderWidth: 1,
  textStyle: { color: '#0F172A', fontFamily: 'Fira Sans' },
  extraCssText: 'backdrop-filter: blur(8px); box-shadow: 0 8px 20px rgba(15,23,42,0.10); border-radius: 10px;',
}

// ── Dynamic alert trend (from timeseries API) ──

export function buildTrendOption(points: TimeseriesPointDto[]): EChartsOption {
  // Group by severity and build hour labels
  const buckets = new Map<string, { CRITICAL: number; WARNING: number; INFO: number }>()
  points.forEach((p) => {
    const hour = p.bucketStart?.substring(11, 16) ?? '--:--'
    if (!buckets.has(hour)) buckets.set(hour, { CRITICAL: 0, WARNING: 0, INFO: 0 })
    const entry = buckets.get(hour)!
    const sev = p.severity as keyof typeof entry
    if (sev && sev in entry) entry[sev] = (entry[sev] ?? 0) + p.count
  })

  const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b))
  const labels = sorted.map(([h]) => h)
  const critical = sorted.map(([, v]) => v.CRITICAL)
  const warning = sorted.map(([, v]) => v.WARNING)
  const info = sorted.map(([, v]) => v.INFO)

  return {
    grid: { left: 36, right: 16, top: 12, bottom: 28 },
    tooltip: { trigger: 'axis', ...tooltipBase },
    xAxis: {
      type: 'category', data: labels, boundaryGap: false,
      axisLine: { lineStyle: { color: '#DBEAFE' } },
      axisLabel: { color: '#64748B', fontFamily: 'Fira Code', fontSize: 10, interval: 2 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(30,64,175,0.06)' } },
      axisLabel: { color: '#64748B', fontFamily: 'Fira Code', fontSize: 10 },
    },
    series: [
      sevSeries('CRITICAL', critical, '#DC2626', [0.34, 0.04]),
      sevSeries('WARNING', warning, '#D97706', [0.34, 0.04]),
      sevSeries('INFO', info, '#0EA5E9', [0.34, 0.04]),
    ],
  }
}

function sevSeries(name: string, data: number[], color: string, [hi, lo]: [number, number]) {
  return {
    name, type: 'line' as const, stack: 'a', smooth: true, symbol: 'none' as const, data,
    lineStyle: { color, width: 2 },
    areaStyle: {
      color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: color + Math.round(hi * 255).toString(16).padStart(2, '0') }, { offset: 1, color: color + Math.round(lo * 255).toString(16).padStart(2, '0') }] },
    },
  }
}

// ── Dynamic execution throughput (from timeseries API) ──

export function buildThroughputOption(points: ExecutionTimeseriesPointDto[]): EChartsOption {
  const buckets = new Map<string, { SUCCESS: number; FAILED: number }>()
  points.forEach((p) => {
    const hour = p.bucketStart?.substring(11, 16) ?? '--:--'
    if (!buckets.has(hour)) buckets.set(hour, { SUCCESS: 0, FAILED: 0 })
    const entry = buckets.get(hour)!
    if (p.status === 'SUCCESS') entry.SUCCESS = (entry.SUCCESS ?? 0) + p.count
    else if (p.status === 'FAILED') entry.FAILED = (entry.FAILED ?? 0) + p.count
  })

  const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b))
  const labels = sorted.map(([h]) => h)

  return {
    grid: { left: 36, right: 16, top: 12, bottom: 28 },
    tooltip: { trigger: 'axis', ...tooltipBase },
    xAxis: {
      type: 'category', data: labels,
      axisLine: { lineStyle: { color: '#DBEAFE' } },
      axisLabel: { color: '#64748B', fontFamily: 'Fira Code', fontSize: 10, interval: 2 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(30,64,175,0.06)' } },
      axisLabel: { color: '#64748B', fontFamily: 'Fira Code', fontSize: 10 },
    },
    series: [
      {
        name: 'SUCCESS', type: 'bar', stack: 't', barWidth: 10, roundCap: true,
        data: sorted.map(([, v]) => v.SUCCESS),
        itemStyle: { color: '#16A34A', borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'FAILED', type: 'bar', stack: 't', barWidth: 10,
        data: sorted.map(([, v]) => v.FAILED),
        itemStyle: { color: '#DC2626', borderRadius: [3, 3, 0, 0] },
      },
    ],
    animationDuration: 900,
    animationEasing: 'cubicOut',
  }
}

// ── Dynamic severity pie chart ──

export function buildSeverityOption(alertsBySeverity: Record<string, number>): EChartsOption {
  const total = Object.values(alertsBySeverity).reduce((a, b) => a + b, 0)
  const data = [
    { value: alertsBySeverity.CRITICAL ?? 0, name: 'CRITICAL', itemStyle: { color: '#DC2626' } },
    { value: alertsBySeverity.WARNING ?? 0, name: 'WARNING', itemStyle: { color: '#D97706' } },
    { value: alertsBySeverity.INFO ?? 0, name: 'INFO', itemStyle: { color: '#0EA5E9' } },
  ]
  return {
    tooltip: tooltipBase,
    legend: {
      orient: 'horizontal', bottom: 0,
      textStyle: { color: '#64748B', fontFamily: 'Fira Sans', fontSize: 12 },
      itemWidth: 10, itemHeight: 10,
    },
    series: [{
      type: 'pie', radius: ['52%', '74%'], center: ['50%', '46%'], avoidLabelOverlap: true,
      itemStyle: { borderColor: '#fff', borderWidth: 3 },
      label: {
        show: true, position: 'center',
        formatter: `{c|${total}}\n{a|Alerts}`,
        rich: { c: { fontSize: 28, fontWeight: 700, color: '#0F172A', fontFamily: 'Fira Code', lineHeight: 32 }, a: { fontSize: 11, color: '#64748B', fontFamily: 'Fira Sans' } },
      },
      emphasis: { label: { show: true } },
      data,
    }],
  }
}

// ── Dynamic team bar chart ──

export function buildTeamOption(teamDist: { dimension: string; count: number }[]): EChartsOption {
  const sorted = [...teamDist].sort((a, b) => a.count - b.count)
  return {
    grid: { left: 60, right: 24, top: 8, bottom: 8 },
    tooltip: tooltipBase,
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(30,64,175,0.06)' } },
      axisLabel: { color: '#64748B', fontFamily: 'Fira Code', fontSize: 10 },
    },
    yAxis: {
      type: 'category', data: sorted.map((t) => t.dimension),
      axisLine: { lineStyle: { color: '#DBEAFE' } },
      axisLabel: { color: '#64748B', fontFamily: 'Fira Code', fontSize: 11 },
    },
    series: [{
      type: 'bar', barWidth: 14, data: sorted.map((t) => t.count),
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#1E40AF' }, { offset: 1, color: '#3B82F6' }] },
      },
      label: { show: true, position: 'right', color: '#1E40AF', fontFamily: 'Fira Code', fontSize: 11, fontWeight: 600 },
    }],
    animationDuration: 900,
    animationEasing: 'cubicOut',
  }
}

// ── Sparkline (used in KPI cards, derived from timeseries) ──

export function buildSparkOption(data: number[], color: string): EChartsOption {
  return {
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'line', data, smooth: true, symbol: 'none',
      lineStyle: { color, width: 2 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '40' }, { offset: 1, color: color + '00' }] },
      },
    }],
  }
}

// Extract a flat count array from timeseries points (for KPI sparklines)
export function toSparkData(points: { count: number }[]): number[] {
  return points.map((p) => p.count)
}
