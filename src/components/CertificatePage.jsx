import { useState, useEffect } from 'react'
import { Share2, Check, CheckCircle2, Clock, Copy } from 'lucide-react'
import { fmt } from '../data/services'
import { fetchOrder } from '../api'
import AppStoreBtn from './AppStoreBtn'

const FALLBACK_CARD_NUMBER = '8600000000000000'

function formatCardNumber(cardNumber) {
  return cardNumber.replace(/\D/g, '').replace(/(.{4})(?=.)/g, '$1 ')
}

function LoadingScreen() {
  return (
    <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="spinner" />
    </div>
  )
}

function ErrorScreen() {
  return (
    <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', flexDirection: 'column', gap: 12, padding: '0 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--black)' }}>Сертификат не найден</p>
      <p style={{ fontSize: 14, color: 'var(--sub-gray)' }}>Проверьте ссылку и попробуйте снова</p>
    </div>
  )
}

export default function CertificatePage({ shortCode }) {
  const [order,            setOrder]            = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(false)
  const [linkCopied,       setLinkCopied]       = useState(false)
  const [cardCopied,       setCardCopied]       = useState(false)
  const [paymentSubmitted, setPaymentSubmitted] = useState(() =>
    localStorage.getItem(`hb-payment-submitted:${shortCode}`) === '1'
  )

  useEffect(() => {
    fetchOrder(shortCode)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [shortCode])

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorScreen />

  const isCert  = order.giftType === 'CERT'
  const items   = (isCert ? order.certificates : order.services) ?? []
  const validDays = items[0]?.validDays ?? 90
  const expiry  = new Date(order.createdAt)
  expiry.setDate(expiry.getDate() + validDays)

  const certUrl = `https://gift.happybox.uz/c/${shortCode}`
  const cardNumber = order.partner.cardNumber
    ?? localStorage.getItem(`hb-card-number:${shortCode}`)
    ?? FALLBACK_CARD_NUMBER
  const formattedCardNumber = formatCardNumber(cardNumber)

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'HappyBox — Подарочный сертификат',
        text: `Тебе подарили сертификат в ${order.partner.name}!`,
        url: certUrl,
      })
    } else {
      navigator.clipboard.writeText(certUrl).then(() => {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      })
    }
  }

  const handleCopyCard = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\D/g, '')).then(() => {
      setCardCopied(true)
      setTimeout(() => setCardCopied(false), 2000)
    })
  }

  const handlePaymentSubmitted = () => {
    localStorage.setItem(`hb-payment-submitted:${shortCode}`, '1')
    setPaymentSubmitted(true)
  }

  return (
    <div className="screen">
      <div className="nav">
        <span className="nav-title">Сертификат</span>
        <AppStoreBtn />
      </div>

      <div className="cert-partner-row">
        {order.partner.photo && (
          <img className="cert-partner-logo" src={order.partner.photo} alt={order.partner.name} />
        )}
        <div>
          <div className="cert-partner-name">{order.partner.name}</div>
          {order.partner.instagram && (
            <a
              className="cert-partner-ig"
              href={`https://instagram.com/${order.partner.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{order.partner.instagram}
            </a>
          )}
        </div>
      </div>

      <div className={`cert-page-status ${order.isPaid ? 'cert-page-status--paid' : 'cert-page-status--pending'}`}>
        {order.isPaid
          ? <><CheckCircle2 size={15} strokeWidth={2} /> Активен</>
          : <><Clock size={15} strokeWidth={2} /> {paymentSubmitted ? 'Платёж на проверке' : 'Ожидает оплаты'}</>
        }
      </div>

      <div className="gift-card">
        <div className="gc-orb gc-orb-1" />
        <div className="gc-orb gc-orb-2" />
        <div className="gc-inner">
          <div className="gc-header">
            <span className="gc-brand">HAPPYBOX</span>
            <span className="gc-partner-name">{order.partner.name}</span>
          </div>
          <div className="gc-amount-section">
            <div className="gc-for">{isCert ? 'Подарочный сертификат' : 'Набор услуг'}</div>
            <div className="gc-amount">{fmt(order.totalAmount)}</div>
          </div>
          {items.length > 0 && (
            <div className="gc-services-row">
              {items.slice(0, 2).map(s => (
                <span key={s.id} className="gc-chip">{s.name}</span>
              ))}
              {items.length > 2 && (
                <span className="gc-chip gc-chip-more">+{items.length - 2}</span>
              )}
            </div>
          )}
          <div className="gc-divider" />
          <div className="gc-footer">
            <div>
              <div className="gc-label">Для</div>
              <div className="gc-name">{order.recipient.name}</div>
              <div className="gc-from">от {order.sender.name}</div>
            </div>
            <div>
              <div className="gc-label">Действует до</div>
              <div className="gc-expiry-date">{expiry.toLocaleDateString('ru-RU')}</div>
            </div>
          </div>
        </div>
      </div>

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

      {!order.isPaid && (
        <div className="manual-payment-box">
          <div className="manual-payment-head">
            <span className="manual-payment-title">Оплата переводом</span>
          </div>
          <label className="cert-card-label">Номер карты для оплаты</label>
          <div className="cert-card-input-wrap">
            <span className="cert-card-number">{formattedCardNumber}</span>
            <button className={`cert-copy-btn${cardCopied ? ' copied' : ''}`} onClick={handleCopyCard}>
              {cardCopied
                ? <Check size={17} strokeWidth={2} />
                : <Copy size={17} strokeWidth={1.75} />}
            </button>
          </div>
          <p className="manual-payment-note">
            Переведите точную сумму. После оплаты нажмите кнопку ниже.
          </p>
          <button
            className="btn btn-primary"
            disabled={paymentSubmitted}
            onClick={handlePaymentSubmitted}
          >
            {paymentSubmitted ? 'Платёж отправлен на проверку' : 'Я оплатил'}
          </button>
        </div>
      )}

      <div className="success-actions">
        <button className="btn btn-primary" onClick={handleShare}>
          {linkCopied ? <Check size={17} strokeWidth={2} /> : <Share2 size={17} strokeWidth={1.75} />}
          {linkCopied ? 'Ссылка скопирована' : 'Поделиться сертификатом'}
        </button>
        <AppStoreBtn />
        <div className="success-divider" />
        <a className="btn btn-outline" href="https://gift.happybox.uz" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          На главную
        </a>
      </div>
    </div>
  )
}
