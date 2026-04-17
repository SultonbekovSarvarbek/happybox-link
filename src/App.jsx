import { useState, useEffect } from 'react'
import Landing    from './components/Landing'
import ChooseType from './components/ChooseType'
import Services   from './components/Services'
import Cart       from './components/Cart'
import Recipient  from './components/Recipient'
import Payment    from './components/Payment'
import Success    from './components/Success'

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

export default function App() {
  const [step,          setStep]          = useState(0)
  const [giftType,      setGiftType]      = useState('cert')
  const [cart,          setCart]          = useState([])
  const [depositAmount, setDepositAmount] = useState(0)
  const [recipient,     setRecipient]     = useState({ name: '', phone: '' })
  const [sender,        setSender]        = useState('')
  const [payMethod,     setPayMethod]     = useState('payme')
  const [processing,    setProcessing]    = useState(false)

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
    setRecipient({ name: '', phone: '' })
    setSender('')
    window.scrollTo(0, 0)
  }

  const screens = [
    <Landing    onContinue={() => go(1)} />,

    <ChooseType
      onBack={() => go(0)}
      onSelect={(t) => { setGiftType(t); go(2) }}
    />,

    <Services
      giftType={giftType}
      cart={cart}
      onToggle={toggleCart}
      depositAmount={depositAmount}
      onDepositChange={setDepositAmount}
      onContinue={() => go(giftType === 'cert' ? 3 : 4)}
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
