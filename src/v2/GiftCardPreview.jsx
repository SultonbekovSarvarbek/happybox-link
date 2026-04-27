import { fmt } from '../data/services'

function formatExpiry(createdAtIso, validDays) {
  const base = createdAtIso ? new Date(createdAtIso) : new Date()
  if (Number.isNaN(base.getTime())) return null
  base.setDate(base.getDate() + (validDays ?? 90))
  return base.toLocaleDateString('ru-RU')
}

export default function GiftCardPreview({
  partner,
  giftType,
  totalAmount,
  items = [],
  recipient,
  sender,
  validDays,
  createdAt,
  size = 'normal',
}) {
  const isCert      = giftType === 'cert' || giftType === 'CERT'
  const expiryLabel = formatExpiry(createdAt, validDays)
  const recipientName = recipient?.name?.trim() || 'Получатель'
  const senderName    = sender?.name?.trim()    || 'Отправитель'

  return (
    <div className={`gift-card${size === 'compact' ? ' gift-card--compact' : ''}`}>
      <div className="gc-orb gc-orb-1" />
      <div className="gc-orb gc-orb-2" />
      <div className="gc-inner">
        <div className="gc-header">
          <span className="gc-brand">HAPPYBOX</span>
          <span className="gc-partner-name">{partner?.name ?? '—'}</span>
        </div>
        <div className="gc-amount-section">
          <div className="gc-for">{isCert ? 'Подарочный сертификат' : 'Набор услуг'}</div>
          <div className="gc-amount">{fmt(totalAmount ?? 0)}</div>
        </div>
        {items.length > 0 && (
          <div className="gc-services-row">
            {items.slice(0, 2).map((s, i) => (
              <span key={s.id ?? i} className="gc-chip">{s.name}</span>
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
            <div className="gc-name">{recipientName}</div>
            <div className="gc-from">от {senderName}</div>
          </div>
          {expiryLabel && (
            <div>
              <div className="gc-label">Действует до</div>
              <div className="gc-expiry-date">{expiryLabel}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
