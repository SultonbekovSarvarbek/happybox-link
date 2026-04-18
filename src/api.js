const BASE = '/api'

export function getSlug() {
  const parts = window.location.pathname.split('/').filter(Boolean)
  const idx = parts.indexOf('partner')
  return idx !== -1 ? parts[idx + 1] : parts[0] ?? null
}

export async function fetchPartner(slug) {
  const res = await fetch(`${BASE}/partners/${slug}`)
  if (!res.ok) throw new Error('Партнёр не найден')
  return res.json()
}

export async function fetchServices(slug) {
  const res = await fetch(`${BASE}/partners/${slug}/services`)
  if (!res.ok) throw new Error('Услуги не найдены')
  return res.json()
}
