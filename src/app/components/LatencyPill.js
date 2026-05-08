import React, { useEffect, useState } from 'react'
import { AITO_CALLS_EVENT } from '../../services/aitoTiming'
import './LatencyPill.css'

/**
 * Corner badge showing the most-recent Aito call's endpoint + wall time.
 *
 * Visceral proof of the latency claims on aito.ai/solutions: visitors
 * watch `_predict 28ms` / `_recommend 142ms` flash as they click
 * around. Auto-fades after 4 s of idle so it doesn't compete with the
 * primary content; re-armed on every new event.
 *
 * Same pattern shipped on the ERP demo
 * (aito-erp-demo/frontend/components/shell/LatencyPill.tsx). Different
 * runtime — axios interceptor here, fetch wrapper there — but the
 * window-event interface is identical.
 */
export default function LatencyPill() {
  const [event, setEvent] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timeoutId
    const handler = (e) => {
      setEvent(e.detail)
      setVisible(true)
      if (timeoutId) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => setVisible(false), 4000)
    }
    window.addEventListener(AITO_CALLS_EVENT, handler)
    return () => {
      window.removeEventListener(AITO_CALLS_EVENT, handler)
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [])

  if (!event) return null

  const ms = Math.round(event.ms)
  const isError = event.status >= 400 || event.status === 0

  return (
    <div
      className={`LatencyPill${visible ? ' LatencyPill--visible' : ''}${isError ? ' LatencyPill--error' : ''}`}
      title={`${event.endpoint} returned in ${ms} ms` + (isError ? ` (status ${event.status})` : '')}
    >
      <span className="LatencyPill__dot" />
      <span className="LatencyPill__endpoint">{event.endpoint}</span>
      <span className="LatencyPill__ms">{ms}ms</span>
    </div>
  )
}
