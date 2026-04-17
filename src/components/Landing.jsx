import { Star, MapPin, Gift } from 'lucide-react'

export default function Landing({ onContinue }) {
  return (
    <div className="screen">
      <div className="cover">
        <div className="cover-noise" />
        <div className="cover-orb cover-orb-1" />
        <div className="cover-orb cover-orb-2" />
        <div className="cover-orb cover-orb-3" />
        <div className="cover-center">
          <span className="cover-tag">Beauty &amp; Spa · Ташкент</span>
        </div>
        <div className="cover-fade" />
      </div>

      <div className="partner-wrap">
        <div className="partner-logo">✨</div>
        <h1 className="partner-name">Glam Studio</h1>
        <p className="partner-desc">
          Премиальная студия красоты в центре Ташкента. Профессиональные мастера,
          европейская косметика, уютная атмосфера.
        </p>
        <div className="tags">
          {['Красота', 'Маникюр', 'Волосы', 'Спа'].map(t => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
        <div className="partner-stats">
          <div className="stat">
            <Star size={14} color="#F5A623" fill="#F5A623" strokeWidth={0} />
            <span><span className="stat-value">4.9</span> (128)</span>
          </div>
          <div className="stat">
            <MapPin size={14} color="var(--primary)" strokeWidth={1.75} />
            <span>Чиланзар</span>
          </div>
        </div>
        <div className="promo-banner">
          <div className="promo-icon">
            <Gift size={20} color="var(--primary)" strokeWidth={1.75} />
          </div>
          <div>
            <div className="promo-title">Подарок, который не забудут</div>
            <div className="promo-desc">Сертификат на услуги или пополнение счёта для близкого</div>
          </div>
        </div>
      </div>

      <div className="sticky">
        <button className="btn btn-primary" onClick={onContinue}>
          Подарить сертификат →
        </button>
      </div>
    </div>
  )
}
