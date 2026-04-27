import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { fetchOrder } from '../api'
import { fmt } from '../data/services'
import AppStoreBtn from '../components/AppStoreBtn'
import GiftCardPreview from './GiftCardPreview'
import { analytics } from '../lib/analytics'

function hoursSince(iso) {
  if (!iso) return undefined
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return undefined
  return Math.max(0, Math.round((Date.now() - t) / 3_600_000))
}

function fireOnce(key, fn) {
  if (localStorage.getItem(key) === '1') return
  localStorage.setItem(key, '1')
  fn()
}

function giftTypeFromOrder(order) {
  if (order?.giftType === 'CERT')     return 'cert'
  if (order?.giftType === 'SERVICES') return 'services'
  return order?.giftType
}

export default function CertificateGiftV2({ shortCode }) {
  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    fetchOrder(shortCode)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [shortCode])

  useEffect(() => {
    if (!order) return
    const giftType = giftTypeFromOrder(order)
    const hours    = hoursSince(order.createdAt)

    fireOnce(`hb-analytics-opened:${shortCode}`, () => {
      analytics.trackCertificateOpenedByRecipient({
        certificateId          : shortCode,
        timeSincePurchaseHours : hours,
      })
    })

    if (order.isPaid) {
      fireOnce(`hb-analytics-activated:${shortCode}`, () => {
        analytics.trackCertificateActivated({
          certificateId          : shortCode,
          giftType,
          timeSincePurchaseHours : hours,
        })
      })
    }
  }, [order, shortCode])

  if (loading) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="spinner" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', flexDirection: 'column', gap: 12, padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 500 }}>Сертификат не найден</p>
        <p style={{ fontSize: 14, color: 'var(--sub-gray)' }}>Проверьте ссылку и попробуйте снова</p>
      </div>
    )
  }

  const giftType = giftTypeFromOrder(order)
  const items    = (order.giftType === 'CERT' ? order.certificates : order.services) ?? []

  return (
    <div className="screen">
      <div className="nav">
        <span className="nav-title">Подарок</span>
        <AppStoreBtn />
      </div>

      <div className="v2-recipient-head">
        <div className="v2-recipient-eyebrow">
          <Sparkles size={14} strokeWidth={2} /> Вам подарили
        </div>
        <h1 className="v2-recipient-title">
          {order.recipient.name ? `${order.recipient.name}, это для тебя!` : 'Это для вас!'}
        </h1>
        <p className="v2-recipient-sub">
          От {order.sender.name || 'отправителя'} — сертификат на {fmt(order.totalAmount)} в {order.partner.name}.
        </p>
      </div>

      <div className={`cert-page-status ${order.isPaid ? 'cert-page-status--paid' : 'cert-page-status--pending'}`}>
        {order.isPaid
          ? <><CheckCircle2 size={15} strokeWidth={2} /> Активен</>
          : <><Clock size={15} strokeWidth={2} /> Ожидает оплаты от отправителя</>
        }
      </div>

      <GiftCardPreview
        partner={order.partner}
        giftType={giftType}
        totalAmount={order.totalAmount}
        items={items}
        recipient={order.recipient}
        sender={order.sender}
        validDays={items[0]?.validDays}
        createdAt={order.createdAt}
      />

      {items.length > 0 && (
        <div className="order-box">
          <div className="order-title">Состав сертификата</div>
          {items.map(s => (
            <div key={s.id} className="order-row order-row--col">
              <span className="order-key">{s.name}</span>
              {s.description && <span className="order-desc">{s.description}</span>}
              <span className="order-val">{fmt(s.price)}</span>
            </div>
          ))}
          <div className="order-divider" />
          <div className="order-row">
            <span className="order-total-key">Итого</span>
            <span className="order-total-val">{fmt(order.totalAmount)}</span>
          </div>
        </div>
      )}

      {order.isPaid && order.partner?.instagram && (
        <div className="v2-recipient-hint">
          Подписаться на партнёра:&nbsp;
          <a
            href={`https://instagram.com/${order.partner.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{order.partner.instagram}
          </a>
        </div>
      )}

      <div className="success-actions">
        <AppStoreBtn />
      </div>
    </div>
  )
}
