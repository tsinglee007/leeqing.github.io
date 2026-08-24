import { useCallback, useEffect, useRef } from 'react'

export default function ClickSpark({
  children,
  sparkColor = '#4b7cff',
  sparkSize = 10,
  sparkRadius = 16,
  sparkCount = 8,
  duration = 420,
  easing = 'ease-out',
  extraScale = 1,
}) {
  const canvasRef = useRef(null)
  const sparksRef = useRef([])
  const animationRef = useRef(null)
  const startTimeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return undefined

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = width * ratio
      canvas.height = height * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  const ease = useCallback((t) => {
    if (easing === 'linear') return t
    if (easing === 'ease-in') return t * t
    if (easing === 'ease-in-out') return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2
    return 1 - ((1 - t) ** 2)
  }, [easing])

  const draw = useCallback((timestamp) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    if (!startTimeRef.current) startTimeRef.current = timestamp

    context.clearRect(0, 0, canvas.width, canvas.height)
    sparksRef.current = sparksRef.current.filter((spark) => {
      const elapsed = timestamp - spark.startTime
      if (elapsed >= duration) return false
      const progress = elapsed / duration
      const distance = ease(progress) * sparkRadius * extraScale
      const x = spark.x + Math.cos(spark.angle) * distance
      const y = spark.y + Math.sin(spark.angle) * distance
      context.globalAlpha = 1 - progress
      context.strokeStyle = sparkColor
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(spark.x, spark.y)
      context.lineTo(x, y)
      context.stroke()
      return true
    })
    context.globalAlpha = 1
    animationRef.current = requestAnimationFrame(draw)
  }, [duration, ease, extraScale, sparkColor, sparkRadius])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animationRef.current)
  }, [draw])

  const createSparks = (event) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { left, top } = canvas.getBoundingClientRect()
    const x = event.clientX - left
    const y = event.clientY - top
    const now = performance.now()
    const newSparks = Array.from({ length: sparkCount }, (_, index) => ({
      x,
      y,
      angle: (Math.PI * 2 * index) / sparkCount,
      startTime: now,
      size: sparkSize,
    }))
    sparksRef.current.push(...newSparks)
  }

  return <div className="click-spark" onClick={createSparks}>{children}<canvas ref={canvasRef} aria-hidden="true" /></div>
}
