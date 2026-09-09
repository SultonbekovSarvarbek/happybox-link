import { useState, useEffect } from 'react'
import { Share2, Check, CheckCircle2, Clock, Copy, CreditCard, ChevronRight, Info, X } from 'lucide-react'
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

// Демо-партнёры: у них включены все способы оплаты с номером карты партнёра,
// пока бэкенд не отдаёт partner.paymentMethods. Матчим по slug, id и partnerId.
const DEMO_ALL_METHODS_PARTNERS = new Set([
  'vash-salon',
  '5bd92b10-b024-4df4-8e56-3781295399ff',
  'ed0fa4a3-bbba-42c1-b316-a5ba3fae8b52',
])

// Логотипы: если задан VITE_BRANDFETCH_CLIENT_ID — берём с cdn.brandfetch.io,
// при ошибке загрузки падаем на локальный файл из public/.
const BRANDFETCH_CLIENT_ID = import.meta.env.VITE_BRANDFETCH_CLIENT_ID

const METHOD_CATALOG = {
  click:  { label: 'Click',            brand: 'click.uz',  logo: '/click.png'  },
  payme:  { label: 'Payme',            brand: 'payme.uz',  logo: '/payme.png'  },
  uzum:   { label: 'Uzum',             brand: 'uzum.uz',   logo: '/uzum.png'   },
  alif:   { label: 'Alif',             brand: 'alif.uz',   logo: '/alif.svg'   },
  paynet: { label: 'Paynet',           brand: 'paynet.uz', logo: '/paynet.svg' },
  card:   { label: 'Перевод на карту' },
}
const METHOD_ORDER = Object.keys(METHOD_CATALOG)

function methodLogoSrc(m) {
  if (!m.logo) return null
  return BRANDFETCH_CLIENT_ID
    ? `https://cdn.brandfetch.io/${m.brand}?c=${BRANDFETCH_CLIENT_ID}`
    : m.logo
}

function isDemoPartner(partner) {
  return [partner?.slug, partner?.id, partner?.partnerId]
    .some(v => v && DEMO_ALL_METHODS_PARTNERS.has(String(v)))
}

// Способы оплаты партнёра. Ожидаемый формат с бэкенда:
//   partner.paymentMethods = { paynet: { enabled, cardNumber, qrImage }, click: { enabled, cardNumber }, ... }
// (массив [{ id, enabled, cardNumber, qrImage }] тоже принимается).
// У Click/Payme/Uzum/Alif/card — только номер карты, у Paynet — номер бизнес-карты + фото QR.
function getPaymentMethods(partner, fallbackCardNumber) {
  const raw = partner?.paymentMethods
  if (raw && typeof raw === 'object') {
    const list = Array.isArray(raw) ? raw : Object.entries(raw).map(([id, v]) => ({ id, ...(v ?? {}) }))
    const out = list
      .filter(m => m && METHOD_CATALOG[m.id] && m.enabled !== false && (m.cardNumber || m.qrImage))
      .map(m => ({ id: m.id, cardNumber: m.cardNumber ?? null, qrImage: m.qrImage ?? null }))
      .sort((a, b) => METHOD_ORDER.indexOf(a.id) - METHOD_ORDER.indexOf(b.id))
    if (out.length) return out
  }
  if (isDemoPartner(partner)) {
    return METHOD_ORDER.map(id => ({ id, cardNumber: fallbackCardNumber, qrImage: null }))
  }
  return [{ id: 'card', cardNumber: fallbackCardNumber, qrImage: null }]
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
  const [openMethodId,     setOpenMethodId]     = useState(null)

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

  const handleCopyCard = (number = cardNumber) => {
    navigator.clipboard.writeText(String(number).replace(/\D/g, '')).then(() => {
      setCardCopied(true)
      setTimeout(() => setCardCopied(false), 2000)
    })
  }

  const handlePaymentSubmitted = (method = 'card_transfer') => {
    localStorage.setItem(`hb-payment-submitted:${shortCode}`, '1')
    setPaymentSubmitted(true)
    analytics.trackPaymentSubmittedByRecipient({ certificateId: shortCode, paymentMethod: method })
  }

  const paymentMethods = getPaymentMethods(order.partner, cardNumber)
  const singleMethod   = paymentMethods.length === 1 ? paymentMethods[0] : null
  const openMethod     = paymentMethods.find(m => m.id === openMethodId) ?? null

  const confirmPaid = (methodId) => {
    handlePaymentSubmitted(methodId === 'card' ? 'card_transfer' : methodId)
    setOpenMethodId(null)
  }

  const renderMethodDetails = (m, { note = true } = {}) => (
    <>
      {m.cardNumber && (
        <>
          <label className="cert-card-label">
            {m.id === 'paynet' ? 'Номер бизнес-карты Paynet' : 'Номер карты для оплаты'}
          </label>
          <div className="cert-card-input-wrap">
            <span className="cert-card-number">{formatCardNumber(String(m.cardNumber))}</span>
            <button
              type="button"
              className={`cert-copy-btn${cardCopied ? ' copied' : ''}`}
              onClick={() => handleCopyCard(m.cardNumber)}
              aria-label="Скопировать номер карты"
            >
              {cardCopied ? <Check size={17} strokeWidth={2} /> : <Copy size={17} strokeWidth={1.75} />}
            </button>
          </div>
        </>
      )}
      {m.qrImage && (
        <div className="method-qr-wrap">
          <img className="method-qr" src={m.qrImage} alt={`QR для оплаты ${METHOD_CATALOG[m.id].label}`} />
          <a className="btn btn-outline method-qr-save" href={m.qrImage} download={`qr-${m.id}.png`}>
            Сохранить QR
          </a>
          <p className="manual-payment-note">
            Сохраните QR и отсканируйте его из галереи в приложении банка.
          </p>
        </div>
      )}
      {note && (
        <p className="manual-payment-note">
          Переведите точную сумму {fmt(order.totalAmount)}. После оплаты нажмите кнопку ниже.
        </p>
      )}
    </>
  )

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


      {!order.isPaid && singleMethod && (
        <div className="manual-payment-box">
          <div className="manual-payment-head">
            <span className="manual-payment-title">
              {singleMethod.id === 'card' ? 'Оплата переводом' : `Оплата через ${METHOD_CATALOG[singleMethod.id].label}`}
            </span>
            {methodLogoSrc(METHOD_CATALOG[singleMethod.id]) ? (
              <img
                className="manual-payment-logo"
                src={methodLogoSrc(METHOD_CATALOG[singleMethod.id])}
                alt={METHOD_CATALOG[singleMethod.id].label}
                onError={e => { const l = METHOD_CATALOG[singleMethod.id].logo; if (!e.currentTarget.src.endsWith(l)) e.currentTarget.src = l }}
              />
            ) : (
              <span className="online-pay-icon manual-payment-icon"><CreditCard size={20} strokeWidth={1.75} /></span>
            )}
          </div>
          {renderMethodDetails(singleMethod)}
          <button
            className="btn btn-primary"
            disabled={paymentSubmitted}
            onClick={() => confirmPaid(singleMethod.id)}
          >
            {paymentSubmitted ? 'Платёж отправлен на проверку' : 'Я оплатил'}
          </button>
        </div>
      )}

      {!order.isPaid && !singleMethod && (
        <div className="manual-payment-box online-payment-box">
          <div className="online-payment-head">
            <span className="manual-payment-title">Оплатите</span>
            <span className="online-payment-sub">
              {paymentSubmitted ? 'Платёж отправлен на проверку' : 'Выберите удобный способ'}
            </span>
          </div>
          <div className="online-payment-methods">
            {paymentMethods.map(m => {
              const meta = METHOD_CATALOG[m.id]
              const logo = methodLogoSrc(meta)
              return (
                <button
                  key={m.id}
                  type="button"
                  className="pay-card online-pay-card"
                  onClick={() => setOpenMethodId(m.id)}
                  disabled={paymentSubmitted}
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt={meta.label}
                      className="pay-logo-img"
                      onError={e => { if (!e.currentTarget.src.endsWith(meta.logo)) e.currentTarget.src = meta.logo }}
                    />
                  ) : (
                    <span className="online-pay-icon"><CreditCard size={20} strokeWidth={1.75} /></span>
                  )}
                  <span className="pay-name">{meta.label}</span>
                  <ChevronRight size={18} strokeWidth={1.75} className="online-pay-chevron" />
                </button>
              )
            })}
          </div>
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

      {openMethod && (
        <div className="pay-overlay" onClick={() => setOpenMethodId(null)}>
          <div className="pay-modal method-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <button type="button" className="method-modal-close" onClick={() => setOpenMethodId(null)} aria-label="Закрыть">
              <X size={18} strokeWidth={2} />
            </button>
            <div className="method-modal-head">
              {methodLogoSrc(METHOD_CATALOG[openMethod.id]) ? (
                <img className="method-modal-logo" src={methodLogoSrc(METHOD_CATALOG[openMethod.id])} alt="" />
              ) : (
                <span className="online-pay-icon"><CreditCard size={22} strokeWidth={1.75} /></span>
              )}
              <div>
                <div className="method-modal-title">{METHOD_CATALOG[openMethod.id].label}</div>
                <div className="method-modal-sub">К оплате {fmt(order.totalAmount)}</div>
              </div>
            </div>
            {renderMethodDetails(openMethod)}
            <button className="btn btn-primary" onClick={() => confirmPaid(openMethod.id)}>
              Я оплатил
            </button>
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
