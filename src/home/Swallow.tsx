import { useId } from 'react'

/** Qishloq qaldirgʻochi (tasdiqlangan SVG, viewBox 0 0 120 120). Gradient id'lari useId bilan noyob. Bezak — aria-hidden. */
export function Swallow({ size = 72, className }: { size?: number; className?: string }) {
  const u = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const wg = `${u}-wg`, wg2 = `${u}-wg2`, bel = `${u}-bel`
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true" focusable="false" className={className} data-testid="swallow">
      <defs>
        <linearGradient id={wg} x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E4377" /><stop offset=".5" stopColor="#152040" /><stop offset="1" stopColor="#060A14" /></linearGradient>
        <linearGradient id={wg2} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2E4377" /><stop offset=".5" stopColor="#152040" /><stop offset="1" stopColor="#060A14" /></linearGradient>
        <linearGradient id={bel} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBF3E6" /><stop offset="1" stopColor="#E2CDAF" /></linearGradient>
      </defs>
      <g className="wl" style={{ transformOrigin: '55px 42px' }}><path d="M56 40 C42 38 22 44 4 66 C22 58 38 54 54 56 Z" fill={`url(#${wg})`} /><path d="M54 43 C40 43 24 50 12 60" stroke="#5C78C2" strokeOpacity=".5" strokeWidth="1.4" fill="none" /></g>
      <g className="wr" style={{ transformOrigin: '65px 42px' }}><path d="M64 40 C78 38 98 44 116 66 C98 58 82 54 66 56 Z" fill={`url(#${wg2})`} /><path d="M66 43 C80 43 96 50 108 60" stroke="#5C78C2" strokeOpacity=".5" strokeWidth="1.4" fill="none" /></g>
      <path d="M55 60 C53 76 50 94 45 112 C52 96 57 80 59 64 Z" fill="#0A1122" /><path d="M65 60 C67 76 70 94 75 112 C68 96 63 80 61 64 Z" fill="#0A1122" />
      <path d="M54 58 Q60 72 66 58 Z" fill="#101A33" /><ellipse cx="60" cy="47" rx="7.5" ry="15" fill={`url(#${bel})`} />
      <path d="M52.6 40 Q60 35 67.4 40 L66.5 44 Q60 41.5 53.5 44 Z" fill="#1A2747" /><ellipse cx="60" cy="30" rx="6.2" ry="7" fill="#13203F" />
      <path d="M54 30 Q60 27 66 30 Q66 37 60 38.5 Q54 37 54 30 Z" fill="#B9472A" /><path d="M57 24.5 Q60 18 63 24.5 Q60 26 57 24.5 Z" fill="#B9472A" />
      <path d="M58.6 19.5 L60 16 L61.4 19.5 Z" fill="#1F1F1F" />
    </svg>
  )
}
