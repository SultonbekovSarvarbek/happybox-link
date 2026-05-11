import { useEffect, useState } from 'react'
import { ChevronRight, Gift, SearchX } from 'lucide-react'
import { fetchPartners, assetUrl } from '../api'
import AppStoreBtn from './AppStoreBtn'

export default function PartnersList() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPartners()
      .then(setPartners)
      .catch((e) => setError(e.message ?? 'Не удалось загрузить'))
      .finally(() => setLoading(false))
  }, [])

  const open = (slug) => {
    if (!slug) return
    window.location.assign(`/p/${slug}`)
  }

  if (loading) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (error || partners.length === 0) {
    return (
      <div className="screen error-screen">
        <div className="error-body">
          <div className="error-icon">
            <SearchX size={52} color="var(--sub-gray)" strokeWidth={1.25} />
          </div>
          <h2 className="error-title">Партнёры не найдены</h2>
          <p className="error-desc">{error ?? 'Список временно пуст. Попробуйте позже.'}</p>
        </div>
        <div className="error-footer">
          <AppStoreBtn variant="banner" />
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="pl-header">
        <div className="pl-header-icon">
          <Gift size={22} color="var(--primary)" strokeWidth={1.75} />
        </div>
        <h1 className="pl-title">Партнёры HappyBox</h1>
        <p className="pl-sub">Выберите партнёра, чтобы подарить сертификат</p>
      </div>

      <ul className="pl-list">
        {partners.map((p) => (
          <li key={p.id}>
            <button type="button" className="pl-card" onClick={() => open(p.slug)}>
              <div className="pl-logo">
                {p.photo ? (
                  <img src={assetUrl(p.photo)} alt={p.name} className="pl-logo-img" />
                ) : (
                  <span className="pl-logo-fallback">{p.name?.[0]?.toUpperCase() ?? 'H'}</span>
                )}
              </div>
              <div className="pl-body">
                <div className="pl-name">{p.name}</div>
                {p.description && <div className="pl-desc">{p.description}</div>}
                {p.certificatesCount > 0 && (
                  <div className="pl-meta">
                    {p.certificatesCount} {pluralCerts(p.certificatesCount)}
                  </div>
                )}
              </div>
              <ChevronRight size={20} color="var(--sub-gray)" strokeWidth={1.5} className="pl-chev" />
            </button>
          </li>
        ))}
      </ul>

      <div className="pl-footer">
        <AppStoreBtn variant="banner" />
      </div>
    </div>
  )
}

function pluralCerts(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'сертификат'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'сертификата'
  return 'сертификатов'
}
