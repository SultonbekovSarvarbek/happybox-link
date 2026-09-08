import { useState, useEffect } from 'react'
import { Share2, Check, CheckCircle2, Clock, Copy, CreditCard, Info } from 'lucide-react'
import { fmt } from '../data/services'
import { fetchOrder } from '../api'
import AppStoreBtn from './AppStoreBtn'
import { analytics } from '../lib/analytics'

function hoursSince(iso) {
  if (!iso) return undefined
  const created = new Date(iso).getTime()
  if (Number.isNaN(created)) return undefined
  return Math.max(0, Math.round((Date.now() - created) / 3_600_000))
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

const FALLBACK_CARD_NUMBER = '8600000000000000'

// Партнёры, у которых вместо перевода на карту показываем выбор онлайн-оплаты.
// Матчим по slug, а также по id / partnerId на случай, если slug не приходит в заказе.
const ONLINE_PAYMENT_PARTNERS = new Set([
  'vash-salon',
  '5bd92b10-b024-4df4-8e56-3781295399ff',
  'ed0fa4a3-bbba-42c1-b316-a5ba3fae8b52',
])

// Логотипы: если задан VITE_BRANDFETCH_CLIENT_ID — берём с cdn.brandfetch.io,
// при ошибке загрузки падаем на локальный файл из public/.
const BRANDFETCH_CLIENT_ID = import.meta.env.VITE_BRANDFETCH_CLIENT_ID
const ONLINE_METHODS = [
  { id: 'click', label: 'Click', brand: 'click.uz', logo: '/click.png' },
  { id: 'payme', label: 'Payme', brand: 'payme.uz', logo: '/payme.png' },
  { id: 'uzum',  label: 'Uzum',  brand: 'uzum.uz',  logo: '/uzum.png'  },
  { id: 'alif',  label: 'Alif',  brand: 'alif.uz',  logo: '/alif.svg'  },
]

function methodLogoSrc(m) {
  return BRANDFETCH_CLIENT_ID
    ? `https://cdn.brandfetch.io/${m.brand}?c=${BRANDFETCH_CLIENT_ID}`
    : m.logo
}

function isOnlinePaymentPartner(partner) {
  return [partner?.slug, partner?.id, partner?.partnerId]
    .some(v => v && ONLINE_PAYMENT_PARTNERS.has(String(v)))
}

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
  const [payMethod,        setPayMethod]        = useState('click')
  const [payProcessing,    setPayProcessing]    = useState(false)

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
        certificateId           : shortCode,
        timeSincePurchaseHours  : hours,
      })
    })

    if (order.isPaid) {
      fireOnce(`hb-analytics-purchased:${shortCode}`, () => {
        analytics.trackPurchaseCompleted({
          orderId        : order.id ?? shortCode,
          totalAmount    : order.totalAmount,
          giftType,
          partnerId      : order.partner?.id ?? order.partner?.partnerId,
          paymentMethod  : 'card_transfer',
          deliveryMethod : 'link',
          isFirstPurchase: order.isFirstPurchase,
        })
      })
      fireOnce(`hb-analytics-activated:${shortCode}`, () => {
        analytics.trackCertificateActivated({
          certificateId           : shortCode,
          giftType,
          timeSincePurchaseHours  : hours,
        })
      })
    }
  }, [order, shortCode])

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorScreen />

  const isCert    = order.giftType === 'CERT'
  const items     = (isCert ? order.certificates : order.services) ?? []
  const isBalance = !!order.isBalanceBased
  const isFullyRedeemed = !!order.isRedeemed
  const validDays = items[0]?.validDays ?? 90
  const expiry  = new Date(order.createdAt)
  expiry.setDate(expiry.getDate() + validDays)
  const redemptions = Array.isArray(order.redemptions) ? order.redemptions : []

  const certUrl = `https://gift.happybox.uz/c/${shortCode}`
  const cardNumber = order.partner.cardNumber
    ?? localStorage.getItem(`hb-card-number:${shortCode}`)
    ?? FALLBACK_CARD_NUMBER
  const formattedCardNumber = formatCardNumber(cardNumber)

  const handleShare = () => {
    const igLine = order.partner.instagram ? `📸 Instagram: @${order.partner.instagram}\n` : ''
    const shareText = `Тебе подарили сертификат в ${order.partner.name}!\n\n${igLine}🔗 Ссылка: ${certUrl}`
    if (navigator.share) {
      navigator.share({
        title: 'Happy Gift — Подарочный сертификат',
        text: shareText,
      })
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
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

  const handlePaymentSubmitted = (method = 'card_transfer') => {
    localStorage.setItem(`hb-payment-submitted:${shortCode}`, '1')
    setPaymentSubmitted(true)
    analytics.trackPaymentSubmittedByRecipient({ certificateId: shortCode, paymentMethod: method })
  }

  const onlinePayment = isOnlinePaymentPartner(order.partner)
  const activeMethod  = ONLINE_METHODS.find(m => m.id === payMethod) ?? ONLINE_METHODS[0]
  const isCardTransfer = payMethod === 'card'

  const handleOnlinePay = () => {
    if (payProcessing || paymentSubmitted) return
    setPayProcessing(true)
    setTimeout(() => {
      setPayProcessing(false)
      handlePaymentSubmitted(payMethod)
    }, 1800)
  }

  return (
    <div className="screen">
      <div className="nav">
        <span className="nav-title">{isCert ? 'Подарочный сертификат' : 'Набор услуг'}</span>
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
              <img src="/instagram.svg" alt="" className="partner-ig-icon" />
              @{order.partner.instagram}
            </a>
          )}
        </div>
      </div>

      <div className={`cert-page-status ${order.isPaid ? 'cert-page-status--paid' : 'cert-page-status--pending'}`}>
        {order.isPaid
          ? isFullyRedeemed
            ? <><CheckCircle2 size={15} strokeWidth={2} /> Использован</>
            : <><CheckCircle2 size={15} strokeWidth={2} /> Активен</>
          : <><Clock size={15} strokeWidth={2} /> {paymentSubmitted ? 'Платёж на проверке' : 'Ожидает оплаты'}</>
        }
      </div>

      <div className="gift-card">
        <div className="gc-orb gc-orb-1" />
        <div className="gc-orb gc-orb-2" />
        <div className="gc-inner">
          <div className="gc-header">
            <span className="gc-brand">{order.partner.name}</span>
          </div>
          <div className="gc-amount-section">
            <div className="gc-for">
              {isCert ? 'Подарочный сертификат' : 'Набор услуг'}
            </div>
            <div className="gc-amount">{fmt(order.totalAmount)}</div>
          </div>
          {!isCert && items.length > 0 && (
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

      {isBalance && order.isPaid && (
        <div className="balance-box">
          <div className="balance-label">Остаток на сертификате</div>
          <div className="balance-amount">
            {Number(order.remainingAmount ?? 0)
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            <span className="balance-unit"> сум</span>
          </div>
          {Number(order.remainingAmount) < Number(order.totalAmount) && (
            <div className="balance-sub">из {fmt(order.totalAmount)}</div>
          )}
        </div>
      )}

      {isBalance && redemptions.length > 0 && (
        <div className="order-box">
          <div className="order-title">История списаний</div>
          {redemptions.map(r => (
            <div key={r.id} className="order-row order-row--col">
              <span className="order-key">−{fmt(r.amount)}</span>
              {r.note && <span className="order-desc">{r.note}</span>}
              <span className="order-desc">
                {new Date(r.createdAt).toLocaleString('ru-RU')}
              </span>
            </div>
          ))}
        </div>
      )}

      {!isBalance && !(isCert && items.length <= 1) && (
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

      {Array.isArray(order.partner.notes) && order.partner.notes.length > 0 && (
        <div className="notes-banner" style={{ margin: '0 20px 16px' }}>
          <Info size={16} strokeWidth={1.75} className="notes-icon" />
          <ul className="notes-list">
            {order.partner.notes
              .map(n => String(n).trim())
              .filter(Boolean)
              .map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}


      {!order.isPaid && onlinePayment && (
        <div className="manual-payment-box online-payment-box">
          <div className="online-payment-head">
            <span className="manual-payment-title">Оплатите</span>
            <span className="online-payment-sub">Выберите удобный способ</span>
          </div>
          <div className="online-payment-methods">
            {ONLINE_METHODS.map(m => (
              <button
                key={m.id}
                type="button"
                className={`pay-card online-pay-card${payMethod === m.id ? ' selected' : ''}`}
                onClick={() => setPayMethod(m.id)}
                disabled={paymentSubmitted}
              >
                <img
                  src={methodLogoSrc(m)}
                  alt={m.label}
                  className="pay-logo-img"
                  onError={e => { if (e.currentTarget.src !== location.origin + m.logo) e.currentTarget.src = m.logo }}
                />
                <span className="pay-name">{m.label}</span>
                <span className="pay-radio" />
              </button>
            ))}
            <button
              type="button"
              className={`pay-card online-pay-card online-pay-card--wide${isCardTransfer ? ' selected' : ''}`}
              onClick={() => setPayMethod('card')}
              disabled={paymentSubmitted}
            >
              <span className="online-pay-icon"><CreditCard size={20} strokeWidth={1.75} /></span>
              <span className="pay-name">Перевод на карту</span>
              <span className="pay-radio" />
            </button>
          </div>

          {isCardTransfer && (
            <div className="online-card-transfer">
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
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={paymentSubmitted || payProcessing}
            onClick={isCardTransfer ? () => handlePaymentSubmitted() : handleOnlinePay}
          >
            {paymentSubmitted
              ? 'Платёж отправлен на проверку'
              : isCardTransfer ? 'Я оплатил' : `Оплатить ${fmt(order.totalAmount)}`}
          </button>
        </div>
      )}

      {!order.isPaid && !onlinePayment && (
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
            onClick={() => handlePaymentSubmitted()}
          >
            {paymentSubmitted ? 'Платёж отправлен на проверку' : 'Я оплатил'}
          </button>
        </div>
      )}

      <div className="success-actions">
        {order.isPaid ? (
          <button className="btn btn-primary" onClick={handleShare}>
            {linkCopied ? <Check size={17} strokeWidth={2} /> : <Share2 size={17} strokeWidth={1.75} />}
            {linkCopied ? 'Ссылка скопирована' : 'Поделиться сертификатом'}
          </button>
        ) : (
          <p className="cert-sms-note">
            После оплаты получатель получит СМС-уведомление с сертификатом
          </p>
        )}
        <AppStoreBtn />
        <div className="success-divider" />
        <a
          className="btn btn-outline"
          href={order.partner.id ? `https://gift.happybox.uz/p/${order.partner.id}` : 'https://gift.happybox.uz'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
        >
          На главную
        </a>
      </div>

      {payProcessing && (
        <div className="pay-overlay">
          <div className="pay-modal">
            <div className="spinner" />
            <p className="pay-modal-title">Переходим в {activeMethod.label}</p>
            <p className="pay-modal-sub">Подождите немного…</p>
          </div>
        </div>
      )}

      {cardCopied && (
        <div className="copy-toast" role="status" aria-live="polite">
          <Check size={16} strokeWidth={2.5} />
          Номер карты скопирован
        </div>
      )}
    </div>
  )
}
