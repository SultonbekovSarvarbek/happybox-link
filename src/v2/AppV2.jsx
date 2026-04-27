import { useState, useEffect, useRef } from 'react'
import { SearchX } from 'lucide-react'
import Landing from '../components/Landing'
import AppStoreBtn from '../components/AppStoreBtn'
import { getId, getShortCode, fetchPartner, fetchServices, fetchCertificates, createOrder } from '../api'
import { analytics } from '../lib/analytics'
import PickGiftV2 from './PickGiftV2'
import RecipientV2 from './RecipientV2'
import PayV2 from './PayV2'
import CertificateGiftV2 from './CertificateGiftV2'
import './v2.css'

function ProcessingModal({ title, subtitle }) {
  return (
    <div className="pay-overlay">
      <div className="pay-modal">
        <div className="spinner" />
        <p className="pay-modal-title">{title}</p>
        <p className="pay-modal-sub">{subtitle}</p>
      </div>
    </div>
  )
}

function ClearCartModal({ giftType, onConfirm, onCancel }) {
  const label = giftType === 'cert' ? 'выбранный сертификат' : 'выбранные услуги'
  return (
    <div className="pay-overlay" onClick={onCancel}>
      <div className="pay-modal clear-cart-modal" onClick={e => e.stopPropagation()}>
        <p className="clear-cart-title">Сменить тип подарка?</p>
        <p className="clear-cart-sub">В корзине есть {label}. Очистить и начать заново?</p>
        <div className="clear-cart-actions">
          <button className="clear-cart-btn clear-cart-btn--primary" onClick={onConfirm}>Очистить</button>
          <button className="clear-cart-btn clear-cart-btn--secondary" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    </div>
  )
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
    <div className="screen error-screen">
      <div className="error-body">
        <div className="error-icon">
          <SearchX size={52} color="var(--sub-gray)" strokeWidth={1.25} />
        </div>
        <h2 className="error-title">Партнёр не найден</h2>
        <p className="error-desc">Проверьте ссылку или QR-код и попробуйте снова</p>
      </div>
      <div className="error-footer">
        <p className="error-hint">Вы можете найти других партнёров в приложении HappyBox</p>
        <AppStoreBtn variant="banner" />
      </div>
    </div>
  )
}

function getShortCodeFromUrl(url) {
  try {
    const parts = new URL(url, window.location.origin).pathname.split('/').filter(Boolean)
    const idx = parts.indexOf('c')
    return idx !== -1 ? parts[idx + 1] : null
  } catch {
    return null
  }
}

const shortCode = getShortCode()

function isBuyerView(code) {
  if (!code) return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('buyer') === '1') return true
  return localStorage.getItem(`hb-buyer:${code}`) === '1'
}

export default function AppV2() {
  if (shortCode) {
    return isBuyerView(shortCode)
      ? <PayV2 shortCode={shortCode} />
      : <CertificateGiftV2 shortCode={shortCode} />
  }

  const [step,         setStep]         = useState(0)
  const [giftType,     setGiftType]     = useState('cert')
  const [cart,         setCart]         = useState([])
  const [recipient,    setRecipient]    = useState({ name: '', phone: '+998' })
  const [sender,       setSender]       = useState({ name: '', phone: '+998' })
  const [pendingType,  setPendingType]  = useState(null)
  const [submitting,   setSubmitting]   = useState(false)

  const [partner,      setPartner]      = useState(null)
  const [services,     setServices]     = useState([])
  const [certificates, setCertificates] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  const builderActive = useRef(false)
  const cartTotal = () => cart.reduce((a, s) => a + Number(s.price), 0)
  const go = (n) => { setStep(n); window.scrollTo(0, 0) }

  const startBuilder = () => {
    if (builderActive.current) return
    analytics.trackBuilderStarted()
    builderActive.current = true
  }
  const endBuilderCompleted = () => {
    if (!builderActive.current) return
    analytics.trackBuilderCompleted({ totalPrice: cartTotal(), servicesCount: cart.length })
    builderActive.current = false
  }
  const endBuilderAbandoned = () => {
    if (!builderActive.current) return
    analytics.trackBuilderAbandoned({ servicesCount: cart.length, currentTotal: cartTotal() })
    builderActive.current = false
  }

  useEffect(() => {
    const id = getId()
    if (!id) { setError('Партнёр не найден'); setLoading(false); return }
    Promise.allSettled([fetchPartner(id), fetchServices(id), fetchCertificates(id)])
      .then(([p, s, c]) => {
        if (p.status === 'rejected') { setError('Партнёр не найден'); return }
        setPartner(p.value)
        if (s.status === 'fulfilled') setServices(s.value.map((svc, i) => ({ ...svc, id: svc.id ?? i })))
        if (c.status === 'fulfilled') setCertificates(c.value.map((cert, i) => ({ ...cert, id: cert.id ?? i })))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (builderActive.current) {
        analytics.trackBuilderAbandoned({ servicesCount: cart.length, currentTotal: cartTotal() })
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [cart])

  useEffect(() => {
    if (step === 1 && giftType === 'services') startBuilder()
  }, [step, giftType])

  const handleGiftTypeChange = (next) => {
    if (next === giftType) return
    if (cart.length > 0) {
      setPendingType(next)
      return
    }
    analytics.trackGiftTypeChosen(next)
    setGiftType(next)
  }

  const toggleCart = (svc) => {
    const isInCart = cart.some(s => s.id === svc.id)
    const next = isInCart
      ? cart.filter(s => s.id !== svc.id)
      : [...cart, svc]
    setCart(next)
    if (giftType === 'services') {
      const total = next.reduce((a, s) => a + Number(s.price), 0)
      if (isInCart) analytics.trackBuilderServiceRemoved(svc, total, next.length)
      else          analytics.trackBuilderServiceAdded(svc, total, next.length)
    }
  }

  const submitOrder = async () => {
    setSubmitting(true)
    analytics.trackRecipientInfoEntered()
    analytics.identifyUser({ name: sender.name, phone: sender.phone })
    try {
      const o = await createOrder(partner.partnerId, {
        giftType,
        items: cart.map(s => s.id),
        recipient,
        sender,
      })
      const createdShortCode = getShortCodeFromUrl(o.certificateUrl)
      if (createdShortCode) {
        if (partner.cardNumber) {
          localStorage.setItem(`hb-card-number:${createdShortCode}`, partner.cardNumber)
        }
        localStorage.setItem(`hb-buyer:${createdShortCode}`, '1')
      }
      analytics.trackOrderCreated({
        orderId        : o.id ?? o.orderId ?? createdShortCode,
        totalAmount    : o.totalAmount ?? cartTotal(),
        giftType,
        servicesCount  : cart.length,
        partnerId      : partner.partnerId,
        paymentMethod  : 'card_transfer',
        deliveryMethod : 'link',
        isFirstPurchase: o.isFirstPurchase,
      })
      window.location.assign(`${o.certificateUrl}?v=2&buyer=1`)
    } catch (err) {
      analytics.trackPurchaseFailed({
        errorReason: err?.message ?? 'createOrder failed',
        step       : 'create_order',
        giftType,
      })
      setSubmitting(false)
      alert('Не удалось создать заказ. Попробуйте снова.')
    }
  }

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorScreen />

  const screens = [
    <Landing partner={partner} onContinue={() => go(1)} />,
    <PickGiftV2
      giftType={giftType}
      onGiftTypeChange={handleGiftTypeChange}
      services={services}
      certificates={certificates}
      cart={cart}
      onToggle={toggleCart}
      onContinue={() => {
        if (giftType === 'services') endBuilderCompleted()
        go(2)
      }}
      onBack={() => {
        if (giftType === 'services') endBuilderAbandoned()
        go(0)
      }}
    />,
    <RecipientV2
      partner={partner}
      giftType={giftType}
      cart={cart}
      recipient={recipient}
      sender={sender}
      submitting={submitting}
      onRecipientChange={setRecipient}
      onSenderChange={setSender}
      onContinue={submitOrder}
      onBack={() => go(1)}
    />,
  ]

  return (
    <>
      <div key={step} className="screen-enter">
        {screens[step]}
      </div>
      {submitting && (
        <ProcessingModal title="Создаём заказ..." subtitle="Сейчас откроем страницу оплаты" />
      )}
      {pendingType && (
        <ClearCartModal
          giftType={giftType}
          onConfirm={() => {
            if (giftType === 'services') endBuilderAbandoned()
            analytics.trackGiftTypeChosen(pendingType)
            setCart([])
            setGiftType(pendingType)
            setPendingType(null)
          }}
          onCancel={() => setPendingType(null)}
        />
      )}
    </>
  )
}
