import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

/** Xavfsizlik bo'limi: sahifa foni sovuq kulrang (index.css: html[data-surface='bank']). Chiqqanda qaytariladi. */
export default function SafetyLayout() {
  useEffect(() => {
    const r = document.documentElement
    r.dataset.surface = 'bank'
    return () => {
      delete r.dataset.surface
    }
  }, [])
  return <Outlet />
}
