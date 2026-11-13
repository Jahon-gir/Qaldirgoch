import { MigraLogo } from './Logo'

/** Birinchi ochilishdagi yuklanish ekrani: logo, pastroqda ikki qatorli shior; tugagach silliq soʻnadi (toʻq koʻk fon, ikkala rejimda bir xil). */
export function Splash({ leaving = false }: { leaving?: boolean }) {
  return (
    <div role="status" aria-label="Migra. Your Work. Your World." className={`splash fixed inset-0 z-[100] bg-[#0A1F5C] text-white ${leaving ? 'splash-leaving' : ''}`}>
      <MigraLogo size={132} className="splash-logo absolute left-1/2 top-[32%] -ml-[66px] rounded-[30px]" />
      <div className="absolute inset-x-0 top-[64%] text-center text-[15px] font-medium uppercase tracking-[0.28em]" lang="en" aria-hidden="true">
        <p className="splash-a text-white">Your work</p>
        <i className="splash-line mx-auto my-3 block h-[2px] w-9 bg-[#F59E0B]" />
        <p className="splash-b text-[#F59E0B]">Your world</p>
      </div>
      <div className="absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] left-1/2 h-1 w-32 -translate-x-1/2 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
        <div className="splash-bar h-full rounded-full bg-[#F59E0B]" />
      </div>
    </div>
  )
}
