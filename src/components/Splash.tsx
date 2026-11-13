import { MigraLogo } from './Logo'

/** Birinchi ochilishdagi yuklanish ekrani: logo, ostida shior asta paydo boʻladi (toʻq koʻk fon, har ikkala rejimda bir xil). */
export function Splash() {
  return (
    <div role="status" aria-label="Migra" className="splash fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A1F5C] text-white">
      <MigraLogo size={132} className="splash-logo rounded-[30px]" />
      <p className="splash-tag mt-6 text-lg font-medium tracking-wide" lang="en">Your Work. Your World.</p>
      <div className="absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] h-1 w-32 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
        <div className="splash-bar h-full rounded-full bg-[#F59E0B]" />
      </div>
    </div>
  )
}
