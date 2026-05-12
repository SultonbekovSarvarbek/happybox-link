import { Clock, CalendarDays, Plus, Check, ChevronLeft, Info } from 'lucide-react'
import { fmt } from '../data/services'
import AppStoreBtn from './AppStoreBtn'

function ServiceCard({ svc, inCart, onToggle }) {
  return (
    <div className={`service-card${inCart ? ' in-cart' : ''}`}>
      <div className="svc-info">
        <div className="svc-name">{svc.name}</div>
        {(svc.desc ?? svc.description) && (
          <div className="svc-desc">{svc.desc ?? svc.description}</div>
        )}
        <div className="svc-meta">
          {svc.dur && (
            <span className="svc-dur">
              <Clock size={12} strokeWidth={1.75} />
              {svc.dur}
            </span>
          )}
          {svc.validDays && (
            <span className="svc-dur">
              <CalendarDays size={12} strokeWidth={1.75} />
              {svc.validDays} дней
            </span>
          )}
          <span className="svc-price">{fmt(svc.price)}</span>
        </div>
      </div>
      <button className={`add-btn${inCart ? ' added' : ''}`} onClick={() => onToggle(svc)}>
        {inCart
          ? <Check size={17} strokeWidth={2.5} />
          : <Plus size={17} strokeWidth={2} />
        }
      </button>
    </div>
  )
}

export default function Services({ giftType, partner, services = [], cart, onToggle, onContinue, onBack }) {
  const cartTotal = cart.reduce((a, s) => a + Number(s.price), 0)
  const notes = Array.isArray(partner?.notes)
    ? partner.notes.map(n => String(n).trim()).filter(Boolean)
    : []

  return (
    <div className="screen">
      <div className="nav">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <span className="nav-title">
          {giftType === 'cert' ? 'Выберите сертификат' : 'Выберите услуги'}
        </span>
        <AppStoreBtn />
      </div>
      <div className="progress-wrap">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: '20%' }} />
        </div>
        <div className="progress-meta">
          <span className="progress-step">Шаг 1 из 5</span>
          <span className="progress-label">Услуги</span>
        </div>
      </div>

      {giftType === 'services' && notes.length > 0 && (
        <div className="notes-banner" style={{ marginTop: 16 }}>
          <Info size={16} strokeWidth={1.75} className="notes-icon" />
          <ul className="notes-list">
            {notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      <div className="services-list">
        {services.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p className="empty-title">Нет доступных позиций</p>
            <p className="empty-sub">Партнёр пока не добавил услуги</p>
          </div>
        ) : services.map(svc => (
          <ServiceCard
            key={svc.id}
            svc={svc}
            inCart={cart.some(c => c.id === svc.id)}
            onToggle={onToggle}
          />
        ))}
      </div>

      {cart.length > 0 && (
        <div className="sticky">
          <div className="sticky-row">
            <span className="sticky-label">
              {giftType === 'cert'
                ? `Выбрано: ${cart.length} серт.`
                : `Корзина: ${cart.length} усл.`}
            </span>
            <span className="sticky-total">{fmt(cartTotal)}</span>
          </div>
          <button className="btn btn-primary" onClick={onContinue}>
            Перейти к корзине →
          </button>
        </div>
      )}
    </div>
  )
}
