import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  IconAntennaBars5, IconBattery3, IconCalendar, IconCamera, IconClock, IconMail, IconMessage,
  IconMusic, IconNotes, IconPhone, IconPhoto, IconSettings, IconWifi, IconWorld, type Icon,
} from '@tabler/icons-react'
import { splashState } from '../components/splashState'

/* VAQTINCHALIK (taqdimot): keng ekranda telefon ramkasi ichida avval telefon bosh ekrani; Migra ikonkasi ilovani ochadi.
   Olib tashlash: main.tsx dagi <PhoneRoot> ni va shu papkani oʻchirish. Ikonkalar oʻylab topilgan (haqiqiy brendsiz). */
const FRAME_QUERY = '(min-width: 768px) and (min-height: 640px)'
const inFrame = () => import.meta.env.MODE !== 'test' && typeof matchMedia === 'function' && matchMedia(FRAME_QUERY).matches

type App = { name: string; icon: Icon; color: string }
const GRID: App[] = [
  { name: 'Xabarlar', icon: IconMessage, color: '#3b82c4' },
  { name: 'Kamera', icon: IconCamera, color: '#d4537e' },
  { name: 'Rasmlar', icon: IconPhoto, color: '#639922' },
  { name: 'Kalendar', icon: IconCalendar, color: '#534ab7' },
  { name: 'Soat', icon: IconClock, color: '#444441' },
  { name: 'Eslatma', icon: IconNotes, color: '#0f6e56' },
]
const DOCK: App[] = [
  { name: 'Telefon', icon: IconPhone, color: '#1d9e75' },
  { name: 'Brauzer', icon: IconWorld, color: '#378add' },
  { name: 'Pochta', icon: IconMail, color: '#ba7517' },
  { name: 'Musiqa', icon: IconMusic, color: '#d85a30' },
]

function Tile({ app, size = 52 }: { app: App; size?: number }) {
  const I = app.icon
  return (
    <span className="flex items-center justify-center rounded-[13px] text-white" style={{ width: size, height: size, background: app.color }}>
      <I size={26} aria-hidden />
    </span>
  )
}

function HomeScreen({ onOpen }: { onOpen: () => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const icon = useRef<HTMLImageElement>(null)
  const [box, setBox] = useState<React.CSSProperties | null>(null)
  const time = new Date().toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit', hour12: false })

  const launch = () => {
    if (box || !wrap.current || !icon.current) return
    const w = wrap.current.getBoundingClientRect()
    const r = icon.current.getBoundingClientRect()
    setBox({ left: r.left - w.left, top: r.top - w.top, width: r.width, height: r.height, borderRadius: 13, transition: 'none' })
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setBox({ left: 0, top: 0, width: w.width, height: w.height, borderRadius: 0, transition: 'all .45s ease' })
    }))
    window.setTimeout(onOpen, 480)
  }

  return (
    <div ref={wrap} className="fixed inset-0 z-[120] overflow-hidden text-white" style={{ background: 'linear-gradient(160deg,#2b4a7a,#5d3d7a 55%,#c76b5a)' }}>
      <div className="flex h-7 items-center justify-between px-5 text-[12px] font-medium" aria-hidden="true">
        <span>{time}</span>
        <span className="flex items-center gap-1"><IconAntennaBars5 size={14} /><IconWifi size={14} /><IconBattery3 size={16} /></span>
      </div>
      <div className="grid grid-cols-4 gap-y-5 px-4 pt-8">
        {GRID.map((a) => (
          <div key={a.name} className="flex flex-col items-center gap-1 text-[11px]" aria-hidden="true"><Tile app={a} />{a.name}</div>
        ))}
        <button type="button" onClick={launch} aria-label="Migra" className="flex cursor-pointer flex-col items-center gap-1 text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          <img ref={icon} src="./logo.webp" alt="" width={52} height={52} className="h-[52px] w-[52px] rounded-[13px]" />
          Migra
        </button>
        <div className="flex flex-col items-center gap-1 text-[11px]" aria-hidden="true"><Tile app={{ name: 'Sozlamalar', icon: IconSettings, color: '#888780' }} />Sozlamalar</div>
      </div>
      <div className="absolute inset-x-4 bottom-8 grid h-[76px] grid-cols-4 items-center justify-items-center rounded-[26px] bg-white/20" aria-hidden="true">
        {DOCK.map((a) => <Tile key={a.name} app={a} />)}
      </div>
      {box && <div className="absolute bg-[#0A1F5C]" style={box} />}
    </div>
  )
}

/** Ramka rejimida: bosh ekran → ikonka bosilganda ilova; pastdagi chiziq ilovani yopadi. Boshqa joyda — oddiy ilova. */
export function PhoneRoot({ children }: { children: ReactNode }) {
  const [frame] = useState(inFrame)
  const [home, setHome] = useState(frame)
  useEffect(() => { if (frame) document.title = 'Migra' }, [frame])
  if (!frame) return <>{children}</>
  if (home) return <HomeScreen onOpen={() => setHome(false)} />
  return (
    <>
      {children}
      <button
        type="button"
        aria-label="Bosh ekranga qaytish"
        onClick={() => { splashState.done = false; setHome(true) }}
        className="fixed bottom-0 left-1/2 z-[110] flex h-5 w-24 -translate-x-1/2 cursor-pointer items-end justify-center pb-1"
      >
        <span className="h-1 w-20 rounded-full bg-[#1c1c1e]/70 ring-1 ring-white/60" />
      </button>
    </>
  )
}
