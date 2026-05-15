import { useEffect } from 'react'
import { Star, MapPin, Gift } from 'lucide-react'
import AppStoreBtn from './AppStoreBtn'
import { analytics } from '../lib/analytics'
import { assetUrl } from '../api'
import { fmt } from '../data/services'

const FALLBACK = {
  name: 'Glam Studio',
  description: 'Премиальная студия красоты в центре Ташкента. Профессиональные мастера, европейская косметика, уютная атмосфера.',
  categories: [{ label: 'Красота' }, { label: 'Маникюр' }, { label: 'Волосы' }, { label: 'Спа' }],
  locations: ['Чиланзар'],
  photo: null,
}

export default function Landing({ partner, services = [], certificates = [], onContinue }) {
  const p = partner ?? FALLBACK
  const tags = p.categories?.map(c => c.label ?? c).filter(Boolean) ?? []
  const location = p.locations?.[0] ?? null

  const previewServices = services.slice(0, 3)
  const certPrices = certificates
    .map(c => Number(c.price))
    .filter(n => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b)
  const certRange = certPrices.length >= 2
    ? { min: certPrices[0], max: certPrices[certPrices.length - 1] }
    : null

  useEffect(() => {
    analytics.trackLandingViewed(partner)
  }, [partner])

  return (
    <div className="screen">
      <div className="cover">
        <div className="cover-noise" />
        <div className="cover-orb cover-orb-1" />
        <div className="cover-orb cover-orb-2" />
        <div className="cover-orb cover-orb-3" />
        <div className="cover-orb cover-orb-4" />
        <div className="cover-fade" />
      </div>

      <div className="partner-wrap">
        <div className="partner-logo">
          {p.photo ? (
            <img src={assetUrl(p.photo)} alt={p.name} className="partner-logo-img" />
          ) : (
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>
              {p.name?.[0]?.toUpperCase() ?? 'H'}
            </span>
          )}
        </div>
        <h1 className="partner-name">{p.name}</h1>
        {p.instagram && (
          <a
            className="partner-ig"
            href={`https://instagram.com/${p.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/instagram.svg" alt="" className="partner-ig-icon" />
            @{p.instagram}
          </a>
        )}
        {p.description && (
          <p className="partner-desc">{p.description}</p>
        )}
        {tags.length > 0 && (
          <div className="tags">
            {tags.map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        )}
        <div className="partner-stats">
          <div className="stat">
            <Star size={14} color="#F5A623" fill="#F5A623" strokeWidth={0} />
            <span><span className="stat-value">5.0</span></span>
          </div>
          {location && (
            <div className="stat">
              <MapPin size={14} color="var(--primary)" strokeWidth={1.75} />
              <span>{location}</span>
            </div>
          )}
        </div>
        {previewServices.length > 0 ? (
          <div className="services-preview">
            <div className="services-preview-title">Услуги салона</div>
            <ul className="services-preview-list">
              {previewServices.map(s => (
                <li key={s.id} className="services-preview-item">
                  <span className="services-preview-name">{s.name}</span>
                  <span className="services-preview-price">{fmt(s.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : certRange && (
          <div className="services-preview">
            <div className="services-preview-title">Номиналы сертификатов</div>
            <div className="services-preview-range">
              от <strong>{fmt(certRange.min)}</strong> до <strong>{fmt(certRange.max)}</strong>
            </div>
          </div>
        )}

        <div className="promo-banner">
          <div className="promo-icon">
            <Gift size={20} color="var(--primary)" strokeWidth={1.75} />
          </div>
          <div>
            <div className="promo-title">Подарок, который не забудут</div>
            <div className="promo-desc">Сертификат на услуги или пополнение счёта для близкого</div>
          </div>
        </div>

        <AppStoreBtn variant="banner" />
      </div>

      <div className="sticky">
        <button className="btn btn-primary" onClick={onContinue}>
          Подарить сертификат →
        </button>
      </div>
    </div>
  )
}
