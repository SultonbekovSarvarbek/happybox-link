import { Clock, CalendarDays, Plus, Check, ChevronLeft } from 'lucide-react'
import { fmt } from '../data/services'
import AppStoreBtn from '../components/AppStoreBtn'

const TABS = [
  { value: 'cert',     label: 'Готовый сертификат', hint: 'Выбор партнёра' },
  { value: 'services', label: 'Собрать самому',     hint: 'Из услуг' },
]

function ItemCard({ item, inCart, onToggle }) {
  return (
    <div className={`service-card${inCart ? ' in-cart' : ''}`} onClick={() => onToggle(item)}>
      <div className="svc-info">
        <div className="svc-name">{item.name}</div>
        {(item.desc ?? item.description) && (
          <div className="svc-desc">{item.desc ?? item.description}</div>
        )}
        <div className="svc-meta">
          {item.dur && (
            <span className="svc-dur">
              <Clock size={12} strokeWidth={1.75} />
              {item.dur}
            </span>
          )}
          {item.validDays && (
            <span className="svc-dur">
              <CalendarDays size={12} strokeWidth={1.75} />
              {item.validDays} дней
            </span>
          )}
          <span className="svc-price">{fmt(item.price)}</span>
        </div>
      </div>
      <button
        className={`add-btn${inCart ? ' added' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggle(item) }}
      >
        {inCart
          ? <Check size={17} strokeWidth={2.5} />
          : <Plus size={17} strokeWidth={2} />
        }
      </button>
    </div>
  )
}

export default function PickGiftV2({
  giftType,
  onGiftTypeChange,
  services,
  certificates,
  cart,
  onToggle,
  onContinue,
  onBack,
}) {
  const list = giftType === 'cert' ? certificates : services
  const cartTotal = cart.reduce((a, s) => a + Number(s.price), 0)
  const cartLabel = giftType === 'cert'
    ? `Выбрано: ${cart.length} серт.`
    : `Услуг: ${cart.length}`

  return (
    <div className="screen">
      <div className="nav">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <span className="nav-title">Выберите подарок</span>
        <AppStoreBtn />
      </div>

      <div className="v2-tabs">
        {TABS.map(t => (
          <button
            key={t.value}
            type="button"
            className={`v2-tab${giftType === t.value ? ' v2-tab--active' : ''}`}
            onClick={() => onGiftTypeChange(t.value)}
          >
            <span className="v2-tab-label">{t.label}</span>
            <span className="v2-tab-hint">{t.hint}</span>
          </button>
        ))}
      </div>

      <div className="services-list">
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p className="empty-title">Пока пусто</p>
            <p className="empty-sub">
              {giftType === 'cert'
                ? 'У партнёра нет готовых сертификатов'
                : 'У партнёра нет доступных услуг'}
            </p>
          </div>
        ) : list.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            inCart={cart.some(c => c.id === item.id)}
            onToggle={onToggle}
          />
        ))}
      </div>

      {cart.length > 0 && (
        <div className="sticky">
          <div className="sticky-row">
            <span className="sticky-label">{cartLabel}</span>
            <span className="sticky-total">{fmt(cartTotal)}</span>
          </div>
          <button className="btn btn-primary" onClick={onContinue}>
            Далее: получатель →
          </button>
        </div>
      )}
    </div>
  )
}
