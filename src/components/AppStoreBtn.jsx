import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

// Приложение ещё не опубликовано: вместо перехода в App Store показываем «Скоро».
// Когда выйдет — вернуть ссылку: https://apps.apple.com/uz/app/id6758584836
const COMING_SOON = true
const APP_STORE_URL = 'https://apps.apple.com/uz/app/happybox-%D1%81%D0%B5%D1%80%D1%82%D0%B8%D1%84%D0%B8%D0%BA%D0%B0%D1%82%D1%8B/id6758584836'

function ComingSoonToast({ shown }) {
  if (!shown) return null
  return (
    <div className="copy-toast" role="status" aria-live="polite">
      <Clock size={16} strokeWidth={2.5} />
      Скоро в App Store
    </div>
  )
}

function useComingSoon() {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!shown) return
    const t = setTimeout(() => setShown(false), 2000)
    return () => clearTimeout(t)
  }, [shown])
  const onClick = (e) => {
    if (!COMING_SOON) return
    e.preventDefault()
    setShown(true)
  }
  return { shown, onClick }
}

const AppleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
)

export default function AppStoreBtn({ variant }) {
  const { shown, onClick } = useComingSoon()

  if (variant === 'banner') {
    return (
      <>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="appstore-banner"
        onClick={onClick}
      >
        <AppleIcon className="appstore-apple" />
        <div className="appstore-text">
          <span className="appstore-sub">Скачать</span>
          <span className="appstore-title">Happy Gift в App Store</span>
        </div>
        <svg className="appstore-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </a>
      <ComingSoonToast shown={shown} />
      </>
    )
  }

  return (
    <>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-app-btn"
        onClick={onClick}
      >
        <AppleIcon />
        Мы в App Store
      </a>
      <ComingSoonToast shown={shown} />
    </>
  )
}
