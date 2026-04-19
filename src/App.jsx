import { useState, useEffect } from 'react'
import { SearchX } from 'lucide-react'
import Landing    from './components/Landing'
import ChooseType from './components/ChooseType'
import Services   from './components/Services'
import Cart       from './components/Cart'
import Recipient  from './components/Recipient'
import Payment    from './components/Payment'
import Success    from './components/Success'
import { getSlug, fetchPartner, fetchServices, fetchCertificates } from './api'
import AppStoreBtn from './components/AppStoreBtn'

function PayProcessing() {
  return (
    <div className="pay-overlay">
      <div className="pay-modal">
        <div className="spinner" />
        <p className="pay-modal-title">Обрабатываем оплату...</p>
        <p className="pay-modal-sub">Не закрывайте страницу</p>
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

export default function App() {
  const [step,          setStep]          = useState(0)
  const [giftType,      setGiftType]      = useState('cert')
  const [cart,          setCart]          = useState([])
  const [depositAmount, setDepositAmount] = useState(0)
  const [recipient,     setRecipient]     = useState({ name: '', phone: '+998' })
  const [sender,        setSender]        = useState({ name: '', phone: '+998' })
  const [payMethod,     setPayMethod]     = useState('payme')
  const [processing,    setProcessing]    = useState(false)

  const [partner,       setPartner]       = useState(null)
  const [services,      setServices]      = useState([])
  const [certificates,  setCertificates]  = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  const go = (n) => { setStep(n); window.scrollTo(0, 0) }

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
    const slug = getSlug()
    if (!slug) { setError('Страница партнёра не найдена. Проверьте ссылку или QR-код.'); setLoading(false); return }

    Promise.allSettled([fetchPartner(slug), fetchServices(slug), fetchCertificates(slug)])
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

  const toggleCart = (svc) =>
    setCart(prev =>
      prev.find(s => s.id === svc.id)
        ? prev.filter(s => s.id !== svc.id)
        : [...prev, svc]
    )

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
      onSelect={(t) => { setGiftType(t); go(2) }}
    />,

    <Services
      giftType={giftType}
      services={giftType === 'cert' ? certificates : services}
      cart={cart}
      onToggle={toggleCart}
      depositAmount={depositAmount}
      onDepositChange={setDepositAmount}
      onContinue={() => go(giftType === 'deposit' ? 4 : 3)}
      onBack={() => go(1)}
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
      onRecipientChange={setRecipient}
      onSenderChange={setSender}
      onContinue={() => go(5)}
      onBack={() => go(giftType === 'cert' ? 3 : 2)}
    />,

    <Payment
      cart={cart}
      giftType={giftType}
      depositAmount={depositAmount}
      payMethod={payMethod}
      onPickMethod={setPayMethod}
      onPay={handlePay}
      onBack={() => go(4)}
    />,

    <Success
      partner={partner}
      cart={cart}
      giftType={giftType}
      depositAmount={depositAmount}
      recipient={recipient}
      sender={sender}
      onHome={handleHome}
    />,
  ]

  return (
    <>
      <div key={step} className="screen-enter">
        {screens[step]}
      </div>
      {processing && <PayProcessing />}
    </>
  )
}
