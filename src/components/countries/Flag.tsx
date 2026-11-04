import de from '../../assets/flags/de.svg'
import gb from '../../assets/flags/gb.svg'
import jp from '../../assets/flags/jp.svg'
import kr from '../../assets/flags/kr.svg'
import type { CountryId } from '../../content/countries'

const FLAGS: Record<CountryId, string> = { de, kr, jp, gb }

/** Bayroq 3:2 (flag-icons, MIT): burchak 4px, ingichka chegara. Asl SVG 4:3 — markazdan qirqiladi. */
export function Flag({ id, dim = false }: { id: CountryId; dim?: boolean }) {
  const [w, h] = [48, 32]
  return <img src={FLAGS[id]} alt="" width={w} height={h} className={`shrink-0 rounded-[4px] border-[0.5px] border-ink/25 object-cover ${dim ? 'opacity-60' : ''}`} style={{ width: w, height: h }} />
}
