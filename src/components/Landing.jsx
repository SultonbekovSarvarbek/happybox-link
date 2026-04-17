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

        <a
          href="https://apps.apple.com/uz/app/happybox-%D1%81%D0%B5%D1%80%D1%82%D0%B8%D1%84%D0%B8%D0%BA%D0%B0%D1%82%D1%8B/id6758584836"
          target="_blank"
          rel="noopener noreferrer"
          className="appstore-banner"
        >
          <svg className="appstore-apple" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <div className="appstore-text">
            <span className="appstore-sub">Скачать</span>
            <span className="appstore-title">HappyBox в App Store</span>
          </div>
          <svg className="appstore-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </a>
      </div>

      <div className="sticky">
        <button className="btn btn-primary" onClick={onContinue}>
          Подарить сертификат →
        </button>
      </div>
    </div>
  )
}
