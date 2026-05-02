import { Gift, Scissors, CreditCard, ChevronRight, ChevronLeft } from 'lucide-react'

function TypeCard({ icon, title, desc, onClick, disabled, soon }) {
  return (
    <div className={`type-card${disabled ? ' type-card--disabled' : ''}`} onClick={disabled ? undefined : onClick}>
      <div className="type-icon">{icon}</div>
      <div className="type-content">
        <div className="type-title-row">
          <div className="type-title">{title}</div>
          {soon && <span className="type-soon">Скоро</span>}
        </div>
        <div className="type-desc">{desc}</div>
      </div>
      <ChevronRight size={20} color="var(--border)" strokeWidth={1.75} />
    </div>
  )
}

export default function ChooseType({ onBack, onSelect }) {
  return (
    <div className="screen">
      <div className="nav">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <span className="nav-title">Тип подарка</span>
      </div>
      <div className="section-head">
        <h2 className="section-title">Что подарим?</h2>
        <p className="section-sub">Выберите тип сертификата для близкого</p>
      </div>
      <div className="type-cards">
        <TypeCard
          icon={<Gift size={22} color="var(--primary)" strokeWidth={1.75} />}
          title="Готовый сертификат"
          desc="Выберите готовый сертификат от партнёра"
          onClick={() => onSelect('cert')}
        />
        <TypeCard
          icon={<Scissors size={22} color="var(--primary)" strokeWidth={1.75} />}
          title="Собрать из услуг"
          desc="Выберите конкретные услуги, которые хотите подарить"
          onClick={() => onSelect('services')}
        />
        <TypeCard
          icon={<CreditCard size={22} color="var(--primary)" strokeWidth={1.75} />}
          title="Пополнить депозит"
          desc="Переведите любую сумму на счёт близкого в этом салоне"
          onClick={() => onSelect('deposit')}
        />
      </div>
    </div>
  )
}
