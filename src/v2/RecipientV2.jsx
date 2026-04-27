import { ChevronLeft } from 'lucide-react'
import AppStoreBtn from '../components/AppStoreBtn'
import GiftCardPreview from './GiftCardPreview'

export default function RecipientV2({
  partner,
  giftType,
  cart,
  recipient,
  sender,
  submitting,
  onRecipientChange,
  onSenderChange,
  onContinue,
  onBack,
}) {
  const totalAmount = cart.reduce((a, s) => a + Number(s.price), 0)
  const validDays   = cart[0]?.validDays ?? 90

  const isValid =
    recipient.name.trim().length >= 2 &&
    recipient.phone.replace(/\D/g, '').length >= 11 &&
    sender.name.trim().length >= 2

  const handlePhone = (val, current, onChange) => {
    let digits = val.replace(/\D/g, '')
    if (digits.startsWith('998')) digits = digits.slice(3)
    digits = digits.slice(0, 9)
    onChange({ ...current, phone: `+998${digits}` })
  }

  return (
    <div className="screen">
      <div className="nav">
        <button className="nav-back" onClick={onBack}>
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <span className="nav-title">Получатель</span>
        <AppStoreBtn />
      </div>

      <div className="v2-preview-wrap">
        <div className="v2-preview-label">Так увидит получатель</div>
        <GiftCardPreview
          partner={partner}
          giftType={giftType}
          totalAmount={totalAmount}
          items={cart}
          recipient={recipient}
          sender={sender}
          validDays={validDays}
        />
      </div>

      <div className="form-section">
        <div className="form-group">
          <label className="form-label">Имя получателя</label>
          <input
            type="text"
            className="form-input"
            placeholder="Например: Азиза"
            value={recipient.name}
            onChange={e => onRecipientChange({ ...recipient, name: e.target.value })}
          />
          <div className="form-hint">Будет указано на карточке подарка</div>
        </div>
        <div className="form-group">
          <label className="form-label">Номер получателя</label>
          <input
            type="tel"
            className="form-input"
            placeholder="+998 90 123 45 67"
            value={recipient.phone}
            onChange={e => handlePhone(e.target.value, recipient, onRecipientChange)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Ваше имя</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ваше имя"
            value={sender.name}
            onChange={e => onSenderChange({ ...sender, name: e.target.value })}
          />
          <div className="form-hint">Получатель увидит, от кого подарок</div>
        </div>
        <div className="form-group">
          <label className="form-label">Ваш номер</label>
          <input
            type="tel"
            className="form-input"
            placeholder="+998 90 123 45 67"
            value={sender.phone}
            onChange={e => handlePhone(e.target.value, sender, onSenderChange)}
          />
          <div className="form-hint">Чтобы вы могли вернуться к заказу</div>
        </div>
      </div>

      <div className="sticky">
        <button className="btn btn-primary" disabled={!isValid || submitting} onClick={onContinue}>
          {submitting ? 'Создаём заказ...' : 'Перейти к оплате →'}
        </button>
      </div>
    </div>
  )
}
