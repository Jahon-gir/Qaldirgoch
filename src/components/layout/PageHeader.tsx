import { useNavigate } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'

export function PageHeader({ title, back }: { title: string; back?: boolean }) {
  const nav = useNavigate()
  return (
    <header className="flex min-h-[56px] items-center gap-2">
      {back && (
        <button onClick={() => nav(-1)} aria-label="Orqaga" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full active:bg-surface-2">
          <IconArrowLeft size={24} aria-hidden />
        </button>
      )}
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  )
}
