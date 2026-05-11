const ORIGIN = import.meta.env.PROD ? 'https://happybox.uz' : ''
const ASSET_ORIGIN = import.meta.env.PROD ? 'https://gift.happybox.uz' : ''
const BASE = `${ORIGIN}/api`

export function assetUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${ASSET_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

export function getId() {
  const parts = window.location.pathname.split('/').filter(Boolean)
  const idx = parts.indexOf('p')
  return idx !== -1 ? parts[idx + 1] : parts[0] ?? null
}

export function getShortCode() {
  const parts = window.location.pathname.split('/').filter(Boolean)
  const idx = parts.indexOf('c')
  return idx !== -1 ? parts[idx + 1] : null
}

export async function fetchPartner(id) {
  const res = await fetch(`${BASE}/partners/p/${id}`)
  if (!res.ok) throw new Error('Партнёр не найден')
  return res.json()
}

export async function fetchPartners() {
  const res = await fetch(`${BASE}/partners`)
  if (!res.ok) throw new Error('Не удалось загрузить список партнёров')
  return res.json()
}

export async function fetchServices(id) {
  const res = await fetch(`${BASE}/partners/p/${id}/services`)
  if (!res.ok) throw new Error('Услуги не найдены')
  return res.json()
}

export async function fetchCertificates(id) {
  const res = await fetch(`${BASE}/partners/p/${id}/certificates`)
  if (!res.ok) throw new Error('Сертификаты не найдены')
  return res.json()
}

export async function fetchOrder(shortCode) {
  const res = await fetch(`${BASE}/web/orders/${shortCode}`)
  if (!res.ok) throw new Error('Заказ не найден')
  return res.json()
}

export async function createOrder(partnerId, { giftType, items, recipient, sender }) {
  const res = await fetch(`${BASE}/web/partners/p/${partnerId}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ giftType, items, recipient, sender }),
  })
  if (!res.ok) throw new Error('Не удалось создать заказ')
  return res.json()
}
