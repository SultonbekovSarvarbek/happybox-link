const BASE = '/api'

export function getId() {
  const parts = window.location.pathname.split('/').filter(Boolean)
  const idx = parts.indexOf('partner')
  return idx !== -1 ? parts[idx + 1] : parts[0] ?? null
}

export async function fetchPartner(id) {
  const res = await fetch(`${BASE}/partners/${id}`)
  if (!res.ok) throw new Error('Партнёр не найден')
  return res.json()
}

export async function fetchServices(id) {
  const res = await fetch(`${BASE}/partners/${id}/services`)
  if (!res.ok) throw new Error('Услуги не найдены')
  return res.json()
}

export async function fetchCertificates(id) {
  const res = await fetch(`${BASE}/partners/${id}/certificates`)
  if (!res.ok) throw new Error('Сертификаты не найдены')
  return res.json()
}
