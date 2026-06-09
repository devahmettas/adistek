import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import LanguageGate from '../components/menu/LanguageGate'
import { hasMenuLanguageSelected } from '../i18n'

export default function PublicMenuLayout() {
  const [languageReady, setLanguageReady] = useState(hasMenuLanguageSelected)

  if (!languageReady) {
    return <LanguageGate onSelect={() => setLanguageReady(true)} />
  }

  return <Outlet />
}
