import { useEffect } from 'react'
import { Star, MapPin, Gift } from 'lucide-react'
import AppStoreBtn from './AppStoreBtn'
import { analytics } from '../lib/analytics'
import { assetUrl } from '../api'

function InstagramIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

const FALLBACK = {
  name: 'Glam Studio',
  description: 'Премиальная студия красоты в центре Ташкента. Профессиональные мастера, европейская косметика, уютная атмосфера.',
  categories: [{ label: 'Красота' }, { label: 'Маникюр' }, { label: 'Волосы' }, { label: 'Спа' }],
  locations: ['Чиланзар'],
  photo: null,
}

export default function Landing({ partner, onContinue }) {
  const p = partner ?? FALLBACK
  const tags = p.categories?.map(c => c.label ?? c).filter(Boolean) ?? []
  const location = p.locations?.[0] ?? null

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
            <InstagramIcon size={14} />
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
            <span><span className="stat-value">4.9</span> (128)</span>
          </div>
          {location && (
            <div className="stat">
              <MapPin size={14} color="var(--primary)" strokeWidth={1.75} />
              <span>{location}</span>
            </div>
          )}
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
