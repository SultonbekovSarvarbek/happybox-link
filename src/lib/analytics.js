import * as amplitude from '@amplitude/unified'

const GIFT_TYPE_MAP = {
  cert    : 'ready',
  services: 'custom',
  deposit : 'deposit',
}

let initialized = false

function certificateType(giftType) {
  return GIFT_TYPE_MAP[giftType] ?? giftType ?? null
}

function clean(props) {
  if (!props) return undefined
  const out = {}
  for (const [k, v] of Object.entries(props)) {
    if (v !== undefined && v !== null) out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

function track(eventName, props) {
  if (!initialized) return
  try {
    amplitude.track(eventName, clean(props))
  } catch (err) {
    console.warn('[analytics] track failed:', eventName, err)
  }
}

export const analytics = {
  init() {
    if (initialized) return
    const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY
    if (!apiKey) {
      console.warn('[analytics] VITE_AMPLITUDE_API_KEY is missing — events will be skipped')
      return
    }
    amplitude.initAll(apiKey, { analytics: { autocapture: true } })
    initialized = true
  },

  identifyUser(user) {
    if (!initialized || !user) return
    try {
      const phone = user.phone?.replace(/\D/g, '')
      if (phone && phone.length >= 11) amplitude.setUserId(phone)
      const id = new amplitude.Identify()
      if (user.name)  id.set('name', user.name)
      if (user.phone) id.set('phone', user.phone)
      if (user.email) id.set('email', user.email)
      if (user.city)  id.set('city', user.city)
      amplitude.identify(id)
    } catch (err) {
      console.warn('[analytics] identifyUser failed:', err)
    }
  },

  trackLandingViewed(partner) {
    track('Landing Viewed', {
      partner_id  : partner?.partnerId ?? partner?.id,
      partner_name: partner?.name,
    })
  },

  trackGiftTypeChosen(giftType) {
    track('Gift Type Chosen', {
      gift_type       : giftType,
      certificate_type: certificateType(giftType),
    })
  },

  trackBuilderStarted() {
    track('Builder Started')
  },

  trackBuilderServiceAdded(service, currentTotal, servicesCount) {
    track('Builder Service Added', {
      service_id      : service?.id,
      service_name    : service?.name,
      service_price   : service?.price != null ? Number(service.price) : undefined,
      service_category: service?.category,
      current_total   : currentTotal,
      services_count  : servicesCount,
    })
  },

  trackBuilderServiceRemoved(service, currentTotal, servicesCount) {
    track('Builder Service Removed', {
      service_id    : service?.id,
      service_name  : service?.name,
      current_total : currentTotal,
      services_count: servicesCount,
    })
  },

  trackBuilderCompleted({ totalPrice, servicesCount, servicesCategories } = {}) {
    track('Builder Completed', {
      total_price        : totalPrice,
      services_count     : servicesCount,
      services_categories: servicesCategories,
    })
  },

  trackBuilderAbandoned({ servicesCount, currentTotal } = {}) {
    track('Builder Abandoned', {
      services_count: servicesCount,
      current_total : currentTotal,
    })
  },

  trackCartViewed(cart) {
    const items = Array.isArray(cart) ? cart : []
    track('Cart Viewed', {
      items_count : items.length,
      total_amount: items.reduce((a, s) => a + Number(s?.price ?? 0), 0),
    })
  },

  trackRecipientInfoEntered() {
    track('Recipient Info Entered')
  },

  trackOrderCreated({ orderId, totalAmount, giftType, servicesCount, partnerId } = {}) {
    track('Order Created', {
      order_id        : orderId,
      total_amount    : totalAmount,
      certificate_type: certificateType(giftType),
      services_count  : servicesCount,
      partner_id      : partnerId,
    })
  },

  trackPurchaseFailed({ errorReason, step, giftType } = {}) {
    track('Purchase Failed', {
      error_reason    : errorReason,
      step,
      certificate_type: certificateType(giftType),
    })
  },

  trackPurchaseCompleted({ orderId, totalAmount, giftType, partnerId } = {}) {
    track('Purchase Completed', {
      order_id        : orderId,
      total_amount    : totalAmount,
      certificate_type: certificateType(giftType),
      partner_id      : partnerId,
    })
  },

  trackCertificateOpenedByRecipient({ certificateId, timeSincePurchaseHours } = {}) {
    track('Certificate Opened by Recipient', {
      certificate_id            : certificateId,
      time_since_purchase_hours : timeSincePurchaseHours,
    })
  },

  trackCertificateActivated({ certificateId, giftType, timeSincePurchaseHours } = {}) {
    track('Certificate Activated', {
      certificate_id            : certificateId,
      certificate_type          : certificateType(giftType),
      time_since_purchase_hours : timeSincePurchaseHours,
    })
  },

  trackPaymentSubmittedByRecipient({ certificateId } = {}) {
    track('Payment Submitted by Recipient', {
      certificate_id: certificateId,
    })
  },
}
