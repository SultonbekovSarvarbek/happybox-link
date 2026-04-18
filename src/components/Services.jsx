import { useState } from 'react'
import { Clock, Plus, Check, ChevronLeft } from 'lucide-react'
import { fmt } from '../data/services'
import AppStoreBtn from './AppStoreBtn'

const CHIPS = [50000, 100000, 200000, 500000]

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

export default function Services({ giftType, services = [], cart, onToggle, depositAmount, onDepositChange, onContinue, onBack }) {
  const [activeChip, setActiveChip] = useState(null)
  const isCert    = giftType === 'cert'
  const cartTotal = cart.reduce((a, s) => a + s.price, 0)

  const pickChip = (amt) => {
    setActiveChip(amt)
    onDepositChange(amt)
  }

  const pickCustom = (val) => {
    setActiveChip(null)
    onDepositChange(parseInt(val) || 0)
  }

  return (
    <div className="screen">
      <div className="nav">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <span className="nav-title">{isCert ? 'Выберите услуги' : 'Сумма депозита'}</span>
        <AppStoreBtn />
      </div>
      <div className="progress-wrap">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: '20%' }} />
        </div>
        <div className="progress-meta">
          <span className="progress-step">Шаг 1 из {isCert ? '5' : '4'}</span>
          <span className="progress-label">{isCert ? 'Услуги' : 'Депозит'}</span>
        </div>
      </div>

      {isCert ? (
        <div className="services-list">
          {services.map(svc => (
            <ServiceCard
              key={svc.id}
              svc={svc}
              inCart={cart.some(c => c.id === svc.id)}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : (
        <div className="deposit-section">
          <p className="section-sub" style={{ marginBottom: '14px' }}>
            Выберите сумму пополнения
          </p>
          <div className="deposit-grid">
            {CHIPS.map(amt => (
              <div
                key={amt}
                className={`amount-chip${activeChip === amt ? ' selected' : ''}`}
                onClick={() => pickChip(amt)}
              >
                <div className="chip-val">{amt.toLocaleString('ru-RU')}</div>
                <div className="chip-cur">сум</div>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Или введите сумму</label>
            <input
              type="number"
              className="form-input"
              placeholder="Введите сумму (сум)"
              onChange={e => pickCustom(e.target.value)}
            />
          </div>
        </div>
      )}

      {isCert
        ? cart.length > 0 && (
          <div className="sticky">
            <div className="sticky-row">
              <span className="sticky-label">Корзина: {cart.length} усл.</span>
              <span className="sticky-total">{fmt(cartTotal)}</span>
            </div>
            <button className="btn btn-primary" onClick={onContinue}>
              Перейти к корзине →
            </button>
          </div>
        )
        : (
          <div className="sticky">
            <div className="sticky-row">
              <span className="sticky-label">Сумма пополнения</span>
              <span className="sticky-total">{fmt(depositAmount)}</span>
            </div>
            <button
              className="btn btn-primary"
              disabled={depositAmount < 10000}
              onClick={onContinue}
            >
              Продолжить →
            </button>
          </div>
        )
      }
    </div>
  )
}
