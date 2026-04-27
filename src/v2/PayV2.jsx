import { useEffect, useState } from 'react'
import { Check, Copy, Share2, CheckCircle2, Clock, ChevronLeft } from 'lucide-react'
import { fetchOrder } from '../api'
import { fmt } from '../data/services'
import AppStoreBtn from '../components/AppStoreBtn'
import GiftCardPreview from './GiftCardPreview'
import { analytics } from '../lib/analytics'

const FALLBACK_CARD_NUMBER = '8600000000000000'

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

function formatCardNumber(n) {
  return n.replace(/\D/g, '').replace(/(.{4})(?=.)/g, '$1 ')
}

function giftTypeFromOrder(order) {
  if (order?.giftType === 'CERT')     return 'cert'
  if (order?.giftType === 'SERVICES') return 'services'
  return order?.giftType
}

export default function PayV2({ shortCode }) {
  const [order,            setOrder]            = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(false)
  const [cardCopied,       setCardCopied]       = useState(false)
  const [linkCopied,       setLinkCopied]       = useState(false)
  const [paymentSubmitted, setPaymentSubmitted] = useState(() =>
    localStorage.getItem(`hb-payment-submitted:${shortCode}`) === '1'
  )

  useEffect(() => {
    fetchOrder(shortCode)
      .then(setOrder)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [shortCode])

  useEffect(() => {
    if (!order?.isPaid) return
    const giftType = giftTypeFromOrder(order)
    const hours    = hoursSince(order.createdAt)
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
        certificateId          : shortCode,
        giftType,
        timeSincePurchaseHours : hours,
      })
    })
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
        <p style={{ fontSize: 16, fontWeight: 500 }}>Заказ не найден</p>
      </div>
    )
  }

  const cardNumber = order.partner.cardNumber
    ?? localStorage.getItem(`hb-card-number:${shortCode}`)
    ?? FALLBACK_CARD_NUMBER

  const recipientUrl = `${window.location.origin}/c/${shortCode}?v=2`

  const handleCopyCard = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\D/g, '')).then(() => {
      setCardCopied(true)
      setTimeout(() => setCardCopied(false), 2000)
    })
  }

  const handlePaymentSubmitted = () => {
    localStorage.setItem(`hb-payment-submitted:${shortCode}`, '1')
    setPaymentSubmitted(true)
    analytics.trackPaymentSubmittedByRecipient({ certificateId: shortCode })
  }

  const handleShare = () => {
    const igLine = order.partner.instagram ? `📸 Instagram: @${order.partner.instagram}\n` : ''
    const text = `Тебе подарили сертификат в ${order.partner.name}!\n\n${igLine}🔗 Ссылка: ${recipientUrl}`
    if (navigator.share) {
      navigator.share({ title: 'HappyBox — Подарочный сертификат', text })
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      })
    }
  }

  const giftType = giftTypeFromOrder(order)
  const items    = (order.giftType === 'CERT' ? order.certificates : order.services) ?? []

  return (
    <div className="screen">
      <div className="nav">
        <button className="nav-back" onClick={() => window.history.back()}>
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <span className="nav-title">Ваш заказ</span>
        <AppStoreBtn />
      </div>

      <div className="v2-buyer-head">
        <div className="v2-buyer-eyebrow">Спасибо за заказ</div>
        <h1 className="v2-buyer-title">
          {order.isPaid
            ? 'Подарок готов к отправке'
            : 'Осталось оплатить и поделиться'}
        </h1>
        <p className="v2-buyer-sub">
          {order.isPaid
            ? `Отправьте ссылку ${order.recipient.name || 'получателю'} — он увидит карточку, как ниже.`
            : `Переведите ${fmt(order.totalAmount)} на карту партнёра, затем поделитесь ссылкой с ${order.recipient.name || 'получателем'}.`}
        </p>
      </div>

      <div className={`cert-page-status ${order.isPaid ? 'cert-page-status--paid' : 'cert-page-status--pending'}`}>
        {order.isPaid
          ? <><CheckCircle2 size={15} strokeWidth={2} /> Оплачено</>
          : <><Clock size={15} strokeWidth={2} /> {paymentSubmitted ? 'Платёж на проверке' : 'Ожидает оплаты'}</>
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

      {!order.isPaid && (
        <div className="manual-payment-box">
          <div className="manual-payment-head">
            <span className="manual-payment-title">Оплата переводом</span>
          </div>
          <label className="cert-card-label">Номер карты для оплаты</label>
          <div className="cert-card-input-wrap">
            <span className="cert-card-number">{formatCardNumber(cardNumber)}</span>
            <button className={`cert-copy-btn${cardCopied ? ' copied' : ''}`} onClick={handleCopyCard}>
              {cardCopied
                ? <Check size={17} strokeWidth={2} />
                : <Copy size={17} strokeWidth={1.75} />}
            </button>
          </div>
          <p className="manual-payment-note">
            Сумма к переводу: <strong>{fmt(order.totalAmount)}</strong>. После оплаты нажмите «Я перевёл».
          </p>
          <button
            className="btn btn-primary"
            disabled={paymentSubmitted}
            onClick={handlePaymentSubmitted}
          >
            {paymentSubmitted ? 'Платёж отправлен на проверку' : 'Я перевёл'}
          </button>
        </div>
      )}

      <div className="success-actions">
        <button className="btn btn-primary" onClick={handleShare}>
          {linkCopied ? <Check size={17} strokeWidth={2} /> : <Share2 size={17} strokeWidth={1.75} />}
          {linkCopied ? 'Ссылка скопирована' : 'Отправить ссылку получателю'}
        </button>
        <AppStoreBtn />
      </div>

      {cardCopied && (
        <div className="copy-toast" role="status" aria-live="polite">
          <Check size={16} strokeWidth={2.5} />
          Номер карты скопирован
        </div>
      )}
    </div>
  )
}
