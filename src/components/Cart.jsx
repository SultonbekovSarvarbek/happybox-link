import { useEffect } from 'react'
import { X, CalendarDays, ChevronLeft, Info } from 'lucide-react'
import { fmt } from '../data/services'
import AppStoreBtn from './AppStoreBtn'
import { analytics } from '../lib/analytics'

export default function Cart({ cart, partner, giftType, onRemove, onContinue, onBack }) {
  const total     = cart.reduce((a, s) => a + Number(s.price), 0)
  const validDays = cart[0]?.validDays ?? 90
  const notes     = Array.isArray(partner?.notes)
    ? partner.notes.map(n => String(n).trim()).filter(Boolean)
    : []

  useEffect(() => {
    analytics.trackCartViewed(cart)
  }, [])

  return (
    <div className="screen">
      <div className="nav">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <span className="nav-title">Корзина</span>
        <AppStoreBtn />
      </div>
      <div className="progress-wrap">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: '40%' }} />
        </div>
        <div className="progress-meta">
          <span className="progress-step">Шаг 2 из 5</span>
          <span className="progress-label">Корзина</span>
        </div>
      </div>

      <div className="cart-list">
        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <div className="cart-empty-text">Корзина пуста</div>
          </div>
        ) : (
          cart.map(s => (
            <div key={s.id} className="cart-item">
              <div className="ci-info">
                <div className="ci-name">{s.name}</div>
                {(s.description ?? s.desc) && (
                  <div className="ci-desc">{s.description ?? s.desc}</div>
                )}
                <div className="ci-price">{fmt(s.price)}</div>
              </div>
              <button className="ci-remove" onClick={() => onRemove(s.id)}>
                <X size={15} strokeWidth={2} />
              </button>
            </div>
          ))
        )}
      </div>

      {giftType === 'services' && notes.length > 0 && (
        <div className="notes-banner" style={{ marginTop: 14 }}>
          <Info size={16} strokeWidth={1.75} className="notes-icon" />
          <ul className="notes-list">
            {notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      <div className="validity-badge">
        <CalendarDays size={16} color="var(--primary)" strokeWidth={1.75} />
        <div className="validity-text">
          Срок действия: <span className="validity-hl">{validDays} дней</span> с момента покупки
        </div>
      </div>

      <div className="sticky">
        <div className="sticky-row">
          <span className="sticky-label">Итого</span>
          <span className="sticky-total">{fmt(total)}</span>
        </div>
        <button className="btn btn-primary" disabled={cart.length === 0} onClick={onContinue}>
          Далее: Получатель →
        </button>
      </div>
    </div>
  )
}
