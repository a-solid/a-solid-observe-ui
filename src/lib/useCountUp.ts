import { useEffect, useRef, useState } from 'react'

/**
 * Animate a number from 0 to `target` over `duration` ms with a cubic ease-out,
 * mirroring the demo's `animateCount()`. Floats keep one decimal.
 *
 * Respects prefers-reduced-motion: jumps straight to the target.
 */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setValue(target)
      return
    }

    const isFloat = String(target).includes('.')
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = target * eased
      setValue(isFloat ? parseFloat(v.toFixed(1)) : Math.round(v))
      if (t < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration])

  return value
}
