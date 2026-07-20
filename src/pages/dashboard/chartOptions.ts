import type { EChartsOption } from 'echarts'
import { hours, trend, throughput } from './mock'

const tooltipBase = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderColor: '#DBEAFE',
  borderWidth: 1,
  textStyle: { color: '#0F172A', fontFamily: 'Fira Sans' },
  extraCssText: 'backdrop-filter: blur(8px); box-shadow: 0 8px 20px rgba(15,23,42,0.10); border-radius: 10px;',
}

// ── Trend & throughput are still mock (no timeseries API integration yet) ──

export function buildTrendOption(t = trend): EChartsOption {
  return {
    grid: { left: 36, right: 16, top: 12, bottom: 28 },
    tooltip: { trigger: 'axis', ...tooltipBase },
    xAxis: {
      type: 'category',
      data: hours,
      boundaryGap: false,
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
        name: 'CRITICAL', type: 'line', stack: 'a', smooth: true, symbol: 'none',
        data: t.CRITICAL,
        lineStyle: { color: '#DC2626', width: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
            { offset: 0, color: 'rgba(220,38,38,0.34)' },
            { offset: 1, color: 'rgba(220,38,38,0.04)' },
          ] },
        },
      },
      {
        name: 'WARNING', type: 'line', stack: 'a', smooth: true, symbol: 'none',
        data: t.WARNING,
        lineStyle: { color: '#D97706', width: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
            { offset: 0, color: 'rgba(217,119,6,0.34)' },
            { offset: 1, color: 'rgba(217,119,6,0.04)' },
          ] },
        },
      },
      {
        name: 'INFO', type: 'line', stack: 'a', smooth: true, symbol: 'none',
        data: t.INFO,
        lineStyle: { color: '#0EA5E9', width: 2 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
            { offset: 0, color: 'rgba(14,165,233,0.34)' },
            { offset: 1, color: 'rgba(14,165,233,0.04)' },
          ] },
        },
      },
    ],
  }
}

export function buildThroughputOption(): EChartsOption {
  return {
    grid: { left: 36, right: 16, top: 12, bottom: 28 },
    tooltip: { trigger: 'axis', ...tooltipBase },
    xAxis: {
      type: 'category',
      data: hours,
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
        data: throughput.success,
        itemStyle: { color: '#16A34A', borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'FAILED', type: 'bar', stack: 't', barWidth: 10,
        data: throughput.failed,
        itemStyle: { color: '#DC2626', borderRadius: [3, 3, 0, 0] },
      },
    ],
    animationDuration: 900,
    animationEasing: 'cubicOut',
  }
}

// ── Dynamic charts (fed from API) ──

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
      type: 'pie',
      radius: ['52%', '74%'],
      center: ['50%', '46%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: '#fff', borderWidth: 3 },
      label: {
        show: true, position: 'center',
        formatter: `{c|${total}}\n{a|Today's Alerts}`,
        rich: {
          c: { fontSize: 28, fontWeight: 700, color: '#0F172A', fontFamily: 'Fira Code', lineHeight: 32 },
          a: { fontSize: 11, color: '#64748B', fontFamily: 'Fira Sans' },
        },
      },
      emphasis: { label: { show: true } },
      data,
    }],
  }
}

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
      type: 'category',
      data: sorted.map((t) => t.dimension),
      axisLine: { lineStyle: { color: '#DBEAFE' } },
      axisLabel: { color: '#64748B', fontFamily: 'Fira Code', fontSize: 11 },
    },
    series: [{
      type: 'bar',
      barWidth: 14,
      data: sorted.map((t) => t.count),
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

export { trend }
