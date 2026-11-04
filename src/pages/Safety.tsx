import { Notice } from '../components/ui/Notice'
import { Soon } from './Soon'

export default function Safety() {
  return (
    <Soon title="Xavfsizlik" items={['Agentlikni litsenziya bo\'yicha tekshirish', 'Taklif yoki e\'lonni AI bilan tekshirish', 'Ishonch telefonlari']}>
      <Notice tone="danger">Ishga joylashtirish uchun oldindan katta pul so'rashsa, to'xtang va avval tekshiring.</Notice>
    </Soon>
  )
}
