import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

/**
 * Mount an ECharts instance onto a ref'd container and keep its option in sync.
 * Re-applies the option whenever it changes, and resizes on window resize.
 * Disposes on unmount.
 *
 * Matches the demo's `echarts.init(el, null, { renderer: 'svg' })` behaviour.
 */
export function useECharts(option: EChartsOption, deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current, null, { renderer: 'svg' })
    chartRef.current = chart
    chart.setOption(option)
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ref, chart: chartRef }
}
