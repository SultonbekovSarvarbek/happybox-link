import { useEffect, useRef } from 'react'
import { Check, Share2 } from 'lucide-react'
import { fmt } from '../data/services'
import AppStoreBtn from './AppStoreBtn'

const COLORS = ['#4998EC', '#FFD700', '#FF6B9D', '#2ECC71', '#FF8C42', '#A855F7', '#5BE0FF']

function runConfetti(canvas) {
  const ctx = canvas.getContext('2d')
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight

  const pieces = Array.from({ length: 110 }, () => ({
    x : Math.random() * canvas.width,
    y : -12 - Math.random() * 100,
    w : 6 + Math.random() * 9,
    h : 3 + Math.random() * 4,
    vx: (Math.random() - .5) * 2.2,
    vy: 3.2 + Math.random() * 3.8,
    r : Math.random() * 360,
    rv: (Math.random() - .5) * 8,
    c : COLORS[Math.floor(Math.random() * COLORS.length)],
    op: 1,
  }))

  let frame = 0
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.r += p.rv
      if (p.y > canvas.height * .6) p.op -= .022
      if (p.op <= 0) return
      ctx.save()
      ctx.globalAlpha = p.op
      ctx.translate(p.x, p.y)
      ctx.rotate(p.r * Math.PI / 180)
      ctx.fillStyle = p.c
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    })
    if (++frame < 240) requestAnimationFrame(tick)
    else ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  tick()
}

export default function Success({ cart, giftType, depositAmount, recipient, sender, onHome }) {
  const canvasRef = useRef(null)
  const isCert    = giftType === 'cert'
  const total     = isCert ? cart.reduce((a, s) => a + s.price, 0) : depositAmount

  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 90)

  useEffect(() => {
    if (canvasRef.current) runConfetti(canvasRef.current)
  }, [])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'HappyBox — Подарочный сертификат',
        text : 'Тебе подарили сертификат в Glam Studio! 🎁',
        url  : window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Ссылка скопирована!'))
    }
  }

  return (
    <div className="screen">
      <canvas ref={canvasRef} className="confetti-canvas" />

      <div className="success-hero">
        <div className="success-circle">
          <Check size={30} color="white" strokeWidth={2.5} />
        </div>
        <h2 className="success-title">Сертификат готов!</h2>
        <p className="success-desc">
          Подарок отправлен получателю.<br />
          Уведомление придёт на телефон.
        </p>
      </div>

      <div className="gift-card">
        <div className="gc-orb gc-orb-1" />
        <div className="gc-orb gc-orb-2" />

        <div className="gc-inner">
          <div className="gc-header">
            <span className="gc-brand">HAPPYBOX</span>
            <span className="gc-partner-name">Glam Studio</span>
          </div>

          <div className="gc-amount-section">
            <div className="gc-for">
              {isCert ? 'Подарочный сертификат' : 'Депозит'}
            </div>
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
              <div className="gc-name">{recipient.name || '—'}</div>
              <div className="gc-from">от {sender.name || 'Вас'}</div>
            </div>
            <div>
              <div className="gc-label">Действует до</div>
              <div className="gc-expiry-date">
                {expiry.toLocaleDateString('ru-RU')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="success-actions">
        <button className="btn btn-primary" onClick={handleShare}>
          <Share2 size={17} strokeWidth={1.75} />
          Поделиться сертификатом
        </button>
        <AppStoreBtn />
        <div className="success-divider" />
        <button className="btn btn-outline" onClick={onHome}>
          На главную
        </button>
      </div>
    </div>
  )
}
