import { User, ChevronLeft } from 'lucide-react'
import AppStoreBtn from './AppStoreBtn'

export default function Recipient({ recipient, sender, giftType, onRecipientChange, onSenderChange, onContinue, onBack }) {
  const isCert     = giftType === 'cert' || giftType === 'services'
  const totalSteps = isCert ? '5' : '4'
  const stepNum    = isCert ? '3' : '2'
  const progress   = isCert ? '60%' : '50%'

  const isValid =
    recipient.name.trim().length >= 2 &&
    recipient.phone.replace(/\D/g, '').length >= 11 &&
    sender.name.trim().length >= 2

  const handleRecipientPhone = (val) => {
    let digits = val.replace(/\D/g, '')
    if (digits.startsWith('998')) digits = digits.slice(3)
    digits = digits.slice(0, 9)
    onRecipientChange({ ...recipient, phone: `+998${digits}` })
  }

  const handleSenderPhone = (val) => {
    let digits = val.replace(/\D/g, '')
    if (digits.startsWith('998')) digits = digits.slice(3)
    digits = digits.slice(0, 9)
    onSenderChange({ ...sender, phone: `+998${digits}` })
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
      <div className="progress-wrap">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: progress }} />
        </div>
        <div className="progress-meta">
          <span className="progress-step">Шаг {stepNum} из {totalSteps}</span>
          <span className="progress-label">Получатель</span>
        </div>
      </div>

      <div className="section-head">
        <h2 className="section-title">Кому дарим?</h2>
        <p className="section-sub">Данные получателя подарка</p>
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
        </div>
        <div className="form-group">
          <label className="form-label">Номер телефона</label>
          <input
            type="tel"
            className="form-input"
            placeholder="+998 90 123 45 67"
            value={recipient.phone}
            onChange={e => handleRecipientPhone(e.target.value)}
          />
          <div className="form-hint">Сертификат отправим через WhatsApp или SMS</div>
        </div>

        <div className="promo-banner" style={{ marginBottom: '16px' }}>
          <div className="promo-icon">
            <User size={20} color="var(--primary)" strokeWidth={1.75} />
          </div>
          <div>
            <div className="promo-title">От кого подарок?</div>
            <div className="promo-desc">Ваше имя будет указано на сертификате как отправитель</div>
          </div>
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
        </div>
        <div className="form-group">
          <label className="form-label">Ваш номер телефона</label>
          <input
            type="tel"
            className="form-input"
            placeholder="+998 90 123 45 67"
            value={sender.phone}
            onChange={e => handleSenderPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="sticky">
        <button className="btn btn-primary" disabled={!isValid} onClick={onContinue}>
          Перейти к оплате →
        </button>
      </div>
    </div>
  )
}
