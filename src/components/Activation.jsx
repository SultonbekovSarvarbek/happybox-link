import { useState } from 'react'
import { ChevronLeft, Copy, Check, BadgeCheck } from 'lucide-react'
import { fmt } from '../data/services'
import AppStoreBtn from './AppStoreBtn'

const CARD_NUMBER = '8600 0000 0000 0000'

export default function Activation({ cart, giftType, depositAmount, onBack }) {
  const [copied, setCopied] = useState(false)

  const isCert = giftType === 'cert' || giftType === 'services'
  const total  = isCert ? cart.reduce((a, s) => a + Number(s.price), 0) : depositAmount

  const handleCopy = () => {
    navigator.clipboard.writeText(CARD_NUMBER.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="screen">
      <div className="nav">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <span className="nav-title">Активация</span>
        <AppStoreBtn />
      </div>

      <div className="cert-created-hero">
        <div className="cert-created-icon">
          <BadgeCheck size={48} color="var(--primary)" strokeWidth={1.5} />
        </div>
        <h2 className="cert-created-title">Сертификат создан!</h2>
        <p className="cert-created-sub">
          Для активации переведите <strong>{fmt(total)}</strong> на карту ниже
        </p>
      </div>

      <div className="cert-card-wrap">
        <label className="cert-card-label">Номер карты для оплаты</label>
        <div className="cert-card-input-wrap">
          <span className="cert-card-number">{CARD_NUMBER}</span>
          <button className={`cert-copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
            {copied
              ? <Check size={17} strokeWidth={2} />
              : <Copy size={17} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      <div className="cert-activate-note">
        После перевода сертификат станет активным и получатель сможет им воспользоваться
      </div>
    </div>
  )
}
