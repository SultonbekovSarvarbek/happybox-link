import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Copy, Check } from 'lucide-react'
import { fmt } from '../data/services'
import AppStoreBtn from './AppStoreBtn'

const CARD_NUMBER = '8600 0000 0000 0000'
const COLORS = ['#4998EC', '#FFD700', '#FF6B9D', '#2ECC71', '#FF8C42', '#A855F7', '#5BE0FF']

function runConfetti(canvas) {
  const ctx = canvas.getContext('2d')
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
  const pieces = Array.from({ length: 110 }, () => ({
    x: Math.random() * canvas.width, y: -12 - Math.random() * 100,
    w: 6 + Math.random() * 9, h: 3 + Math.random() * 4,
    vx: (Math.random() - .5) * 2.2, vy: 3.2 + Math.random() * 3.8,
    r: Math.random() * 360, rv: (Math.random() - .5) * 8,
    c: COLORS[Math.floor(Math.random() * COLORS.length)], op: 1,
  }))
  let frame = 0
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.r += p.rv
      if (p.y > canvas.height * .6) p.op -= .022
      if (p.op <= 0) return
      ctx.save(); ctx.globalAlpha = p.op
      ctx.translate(p.x, p.y); ctx.rotate(p.r * Math.PI / 180)
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    })
    if (++frame < 240) requestAnimationFrame(tick)
    else ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  tick()
}

export default function Activation({ cart, giftType, depositAmount, partner, recipient, sender, onBack }) {
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current) runConfetti(canvasRef.current)
  }, [])

  const isCert    = giftType === 'cert' || giftType === 'services'
  const total     = isCert ? cart.reduce((a, s) => a + Number(s.price), 0) : depositAmount
  const validDays = cart[0]?.validDays ?? 90
  const expiry    = new Date()
  expiry.setDate(expiry.getDate() + validDays)

  const handleCopy = () => {
    navigator.clipboard.writeText(CARD_NUMBER.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="screen" style={{ paddingBottom: 200 }}>
      <canvas ref={canvasRef} className="confetti-canvas" />
      <div className="nav">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <span className="nav-title">Активация</span>
        <AppStoreBtn />
      </div>

      <div className="success-hero" style={{ paddingBottom: 8 }}>
        <h2 className="success-title">Сертификат создан!</h2>
        <p className="success-desc">
          Для активации переведите <strong>{fmt(total)}</strong> на карту ниже
        </p>
      </div>

      <div className="gift-card">
        <div className="gc-orb gc-orb-1" />
        <div className="gc-orb gc-orb-2" />
        <div className="gc-inner">
          <div className="gc-header">
            <span className="gc-brand">HAPPYBOX</span>
            <span className="gc-partner-name">{partner?.name ?? 'HappyBox'}</span>
          </div>
          <div className="gc-amount-section">
            <div className="gc-for">{isCert ? 'Подарочный сертификат' : 'Депозит'}</div>
            <div className="gc-amount">{fmt(total)}</div>
          </div>
          {isCert && cart.length > 0 && (
            <div className="gc-services-row">
              {cart.slice(0, 2).map(s => (
                <span key={s.id} className="gc-chip">{s.name}</span>
              ))}
              {cart.length > 2 && (
                <span className="gc-chip gc-chip-more">+{cart.length - 2}</span>
              )}
            </div>
          )}
          <div className="gc-divider" />
          <div className="gc-footer">
            <div>
              <div className="gc-label">Для</div>
              <div className="gc-name">{recipient?.name || '—'}</div>
              <div className="gc-from">от {sender?.name || 'Вас'}</div>
            </div>
            <div>
              <div className="gc-label">Действует до</div>
              <div className="gc-expiry-date">{expiry.toLocaleDateString('ru-RU')}</div>
            </div>
          </div>
        </div>
      </div>

      {isCert && cart.length > 0 && (
        <div className="order-box">
          <div className="order-title">Состав сертификата</div>
          {cart.map(s => (
            <div key={s.id} className="order-row order-row--col">
              <span className="order-key">{s.name}</span>
              {(s.description ?? s.desc) && (
                <span className="order-desc">{s.description ?? s.desc}</span>
              )}
              <span className="order-val">{fmt(s.price)}</span>
            </div>
          ))}
          <div className="order-divider" />
          <div className="order-row">
            <span className="order-total-key">Итого к оплате</span>
            <span className="order-total-val">{fmt(total)}</span>
          </div>
        </div>
      )}

      <div className="sticky">
        <label className="cert-card-label">Номер карты для оплаты</label>
        <div className="cert-card-input-wrap">
          <span className="cert-card-number">{CARD_NUMBER}</span>
          <button className={`cert-copy-btn${copied ? ' copied' : ''}`} onClick={handleCopy}>
            {copied
              ? <Check size={17} strokeWidth={2} />
              : <Copy size={17} strokeWidth={1.75} />}
          </button>
        </div>
        <div className="cert-activate-note">
          После перевода сертификат станет активным и получатель сможет им воспользоваться
        </div>
      </div>
    </div>
  )
}
