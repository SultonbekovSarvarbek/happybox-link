import { useState, useEffect, useRef } from 'react'
import { SearchX } from 'lucide-react'
import Landing    from './components/Landing'
import ChooseType from './components/ChooseType'
import Services   from './components/Services'
import Cart       from './components/Cart'
import Recipient  from './components/Recipient'
import Payment    from './components/Payment'
import Activation from './components/Activation'
import Success    from './components/Success'
import { getId, getShortCode, fetchPartner, fetchServices, fetchCertificates, createOrder } from './api'
import CertificatePage from './components/CertificatePage'
import AppStoreBtn from './components/AppStoreBtn'
import { analytics } from './lib/analytics'

function ClearCartModal({ giftType, onConfirm, onCancel }) {
  const label = giftType === 'cert' ? 'выбранный сертификат' : 'выбранные услуги'
  return (
    <div className="pay-overlay" onClick={onCancel}>
      <div className="pay-modal clear-cart-modal" onClick={e => e.stopPropagation()}>
        <p className="clear-cart-title">Вы покидаете страницу</p>
        <p className="clear-cart-sub">В корзине есть {label}. Очистить корзину и продолжить?</p>
        <div className="clear-cart-actions">
          <button className="clear-cart-btn clear-cart-btn--primary" onClick={onConfirm}>Очистить</button>
          <button className="clear-cart-btn clear-cart-btn--secondary" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    </div>
  )
}

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

function LoadingScreen() {
  return (
    <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
      <div className="spinner" />
    </div>
  )
}

function ErrorScreen({ message }) {
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

const shortCode = getShortCode()

function getShortCodeFromUrl(url) {
  try {
    const parts = new URL(url, window.location.origin).pathname.split('/').filter(Boolean)
    const idx = parts.indexOf('c')
    return idx !== -1 ? parts[idx + 1] : null
  } catch {
    return null
  }
}

export default function App() {
  if (shortCode) return <CertificatePage shortCode={shortCode} />

  const [step,          setStep]          = useState(0)
  const [giftType,      setGiftType]      = useState('cert')
  const [cart,          setCart]          = useState([])
  const [depositAmount, setDepositAmount] = useState(0)
  const [recipient,     setRecipient]     = useState({ name: '', phone: '+998' })
  const [sender,        setSender]        = useState({ name: '', phone: '+998' })
  const [payMethod,     setPayMethod]     = useState('payme')
  const [processing,    setProcessing]    = useState(false)
  const [pendingType,   setPendingType]   = useState(null)
  const [order,         setOrder]         = useState(null)
  const [submitting,    setSubmitting]    = useState(false)

  const [partner,       setPartner]       = useState(null)
  const [services,      setServices]      = useState([])
  const [certificates,  setCertificates]  = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  const builderActive = useRef(false)

  const go = (n) => { setStep(n); window.scrollTo(0, 0) }

  const cartTotal = () => cart.reduce((a, s) => a + Number(s.price), 0)

  const startBuilder = () => {
    if (builderActive.current) return
    analytics.trackBuilderStarted()
    builderActive.current = true
  }

  const endBuilderCompleted = () => {
    if (!builderActive.current) return
    analytics.trackBuilderCompleted({
      totalPrice    : cartTotal(),
      servicesCount : cart.length,
    })
    builderActive.current = false
  }

  const endBuilderAbandoned = () => {
    if (!builderActive.current) return
    analytics.trackBuilderAbandoned({
      servicesCount: cart.length,
      currentTotal : cartTotal(),
    })
    builderActive.current = false
  }

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      document.documentElement.style.setProperty('--kb-offset', `${kb}px`)
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  useEffect(() => {
    if (step === 2 && giftType === 'services') startBuilder()
  }, [step, giftType])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (builderActive.current) {
        analytics.trackBuilderAbandoned({
          servicesCount: cart.length,
          currentTotal : cartTotal(),
        })
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [cart])

  useEffect(() => {
    const id = getId()
    if (!id) { setError('Страница партнёра не найдена. Проверьте ссылку или QR-код.'); setLoading(false); return }

    Promise.allSettled([fetchPartner(id), fetchServices(id), fetchCertificates(id)])
      .then(([p, s, c]) => {
        if (p.status === 'rejected') { setError('Партнёр не найден'); return }
        setPartner(p.value)
        if (s.status === 'fulfilled')
          setServices(s.value.map((svc, i) => ({ ...svc, id: svc.id ?? i })))
        if (c.status === 'fulfilled')
          setCertificates(c.value.map((cert, i) => ({ ...cert, id: cert.id ?? i })))
      })
      .finally(() => setLoading(false))
  }, [])

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

  const removeFromCart = (id) =>
    setCart(prev => prev.filter(s => s.id !== id))

  const handlePay = () => {
    setProcessing(true)
    setTimeout(() => { setProcessing(false); go(6) }, 2000)
  }

  const handleHome = () => {
    setStep(0)
    setCart([])
    setDepositAmount(0)
    setRecipient({ name: '', phone: '+998' })
    setSender({ name: '', phone: '+998' })
    setOrder(null)
    window.scrollTo(0, 0)
  }

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorScreen message={error} />

  const screens = [
    <Landing
      partner={partner}
      onContinue={() => go(1)}
    />,

    <ChooseType
      onBack={() => go(0)}
      onSelect={(t) => {
        if (cart.length > 0 && t !== giftType) {
          setPendingType(t)
        } else {
          analytics.trackGiftTypeChosen(t)
          setGiftType(t)
          go(2)
        }
      }}
    />,

    <Services
      giftType={giftType}
      services={giftType === 'cert' ? certificates : services}
      cart={cart}
      onToggle={toggleCart}
      depositAmount={depositAmount}
      onDepositChange={setDepositAmount}
      onContinue={() => {
        if (giftType === 'services') endBuilderCompleted()
        go(giftType === 'deposit' ? 4 : 3)
      }}
      onBack={() => {
        if (giftType === 'services') endBuilderAbandoned()
        go(1)
      }}
    />,

    <Cart
      cart={cart}
      onRemove={removeFromCart}
      onContinue={() => go(4)}
      onBack={() => go(2)}
    />,

    <Recipient
      recipient={recipient}
      sender={sender}
      giftType={giftType}
      submitting={submitting}
      onRecipientChange={setRecipient}
      onSenderChange={setSender}
      onContinue={async () => {
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
          if (createdShortCode && partner.cardNumber) {
            localStorage.setItem(`hb-card-number:${createdShortCode}`, partner.cardNumber)
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
          window.location.assign(o.certificateUrl)
        } catch (err) {
          analytics.trackPurchaseFailed({
            errorReason: err?.message ?? 'createOrder failed',
            step       : 'create_order',
            giftType,
          })
          setSubmitting(false)
          alert('Не удалось создать заказ. Попробуйте снова.')
        }
      }}
      onBack={() => go(giftType === 'cert' ? 3 : 2)}
    />,

    <Activation
      cart={cart}
      giftType={giftType}
      depositAmount={depositAmount}
      partner={partner}
      recipient={recipient}
      sender={sender}
      order={order}
      onBack={() => go(4)}
    />,

    <Success
      partner={partner}
      cart={cart}
      giftType={giftType}
      depositAmount={depositAmount}
      recipient={recipient}
      sender={sender}
      order={order}
      onHome={handleHome}
    />,
  ]

  return (
    <>
      <div key={step} className="screen-enter">
        {screens[step]}
      </div>
      {processing && (
        <ProcessingModal
          title="Обрабатываем оплату..."
          subtitle="Не закрывайте страницу"
        />
      )}
      {submitting && (
        <ProcessingModal
          title="Создаём заказ..."
          subtitle="Сейчас откроем страницу оплаты"
        />
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
            go(2)
          }}
          onCancel={() => setPendingType(null)}
        />
      )}
    </>
  )
}
