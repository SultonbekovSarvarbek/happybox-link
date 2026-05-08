import { ChevronLeft } from 'lucide-react'
import { fmt } from '../data/services'
import AppStoreBtn from './AppStoreBtn'

const METHODS = [
  { id: 'payme',  label: 'Payme',  desc: 'Мгновенная оплата', logo: '/payme.png', badge: 'Популярно' },
  { id: 'click',  label: 'Click',  desc: 'Мгновенная оплата', logo: '/click.png', badge: null },
  { id: 'uzum',   label: 'Uzum',   desc: 'Банковская карта',  logo: '/uzum.png',  badge: null },
]

export default function Payment({ cart, payMethod, onPickMethod, onPay, onBack }) {
  const total    = cart.reduce((a, s) => a + Number(s.price), 0)
  const stepNum  = '4'
  const stepOf   = '5'
  const progress = '80%'

  return (
    <div className="screen">
      <div className="nav">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <span className="nav-title">Оплата</span>
        <AppStoreBtn />
      </div>
      <div className="progress-wrap">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: progress }} />
        </div>
        <div className="progress-meta">
          <span className="progress-step">Шаг {stepNum} из {stepOf}</span>
          <span className="progress-label">Оплата</span>
        </div>
      </div>

      <div className="section-head">
        <h2 className="section-title">Способ оплаты</h2>
        <p className="section-sub">Выберите удобный способ</p>
      </div>

      <div className="pay-methods">
        {METHODS.map(m => (
          <div
            key={m.id}
            className={`pay-card${payMethod === m.id ? ' selected' : ''}`}
            onClick={() => onPickMethod(m.id)}
          >
            <img src={m.logo} alt={m.label} className="pay-logo-img" />
            <div className="pay-info">
              <div className="pay-name">{m.label}</div>
              <div className="pay-desc">{m.desc}</div>
            </div>
            {m.badge && <span className="pay-badge">{m.badge}</span>}
            <div className="pay-radio" />
          </div>
        ))}
      </div>

      <div className="order-box">
        <div className="order-title">Детали заказа</div>
        {cart.slice(0, 4).map(s => (
          <div key={s.id} className="order-row">
            <span className="order-key">{s.name}</span>
            <span className="order-val">{fmt(s.price)}</span>
          </div>
        ))}
        {cart.length > 4 && (
          <div className="order-row">
            <span className="order-key" style={{ color: 'var(--border)' }}>
              ...ещё {cart.length - 4} услуги
            </span>
          </div>
        )}
        <div className="order-divider" />
        <div className="order-row">
          <span className="order-total-key">Итого к оплате</span>
          <span className="order-total-val">{fmt(total)}</span>
        </div>
      </div>

      <div className="sticky">
        <button className="btn btn-primary" onClick={onPay}>Оплатить →</button>
      </div>
    </div>
  )
}
