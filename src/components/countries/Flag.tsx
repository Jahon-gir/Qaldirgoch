import de from '../../assets/flags/de.svg'
import gb from '../../assets/flags/gb.svg'
import jp from '../../assets/flags/jp.svg'
import kr from '../../assets/flags/kr.svg'
import type { CountryId } from '../../content/countries'

export const FLAGS: Record<CountryId, string> = { de, kr, jp, gb }

/**
 * Davlat sahifasi tepasidagi toʻliq kenglikdagi bayroq tasmasi (118 px). Asl SVG 4:3, markazdan qirqiladi (doira/belgi buzilmaydi).
 * Germaniya: qirqilsa qora va oltin yoʻl yoʻqoladi — uch teng gorizontal yoʻl rasmiy ranglarda chiziladi.
 */
const DE_BAND = 'linear-gradient(#000 0 33.333%, #DD0000 33.333% 66.667%, #FFCE00 66.667%)'
export function FlagBand({ id }: { id: CountryId }) {
  if (id === 'de') return <div data-testid="flag-band" className="h-[118px] w-full" style={{ background: DE_BAND }} />
  return <img src={FLAGS[id]} alt="" data-testid="flag-band" className="block h-[118px] w-full object-cover" />
}

/** Bayroq 3:2 (flag-icons, MIT): burchak 4px, ingichka chegara. Asl SVG 4:3 — markazdan qirqiladi. */
export function Flag({ id, dim = false }: { id: CountryId; dim?: boolean }) {
  const [w, h] = [48, 32]
  return <img src={FLAGS[id]} alt="" width={w} height={h} className={`shrink-0 rounded-[4px] border-[0.5px] border-ink/25 object-cover ${dim ? 'opacity-60' : ''}`} style={{ width: w, height: h }} />
}

/**
 * Dumaloq bayroq (til tanlash va kurs sarlavhasi): asl 4:3 SVG doiraga qirqiladi (object-fit: cover).
 * gray — qulfli til (oq-qora va xira).
 */
export function RoundFlag({ id, size, gray = false }: { id: CountryId; size: number; gray?: boolean }) {
  return (
    <img
      src={FLAGS[id]}
      alt=""
      width={size}
      height={size}
      className={`block shrink-0 rounded-full border-[0.5px] border-ink/20 object-cover ${gray ? 'opacity-50 grayscale' : ''}`}
      style={{ width: size, height: size }}
    />
  )
}
