'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './Footer'

// Routes on which the global footer should be hidden (full-screen chat layouts)
const HIDE_FOOTER_PREFIXES = ['/messages', '/learn/']

export function ConditionalFooter() {
  const pathname = usePathname()
  const hide = HIDE_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (hide) return null
  return <Footer />
}
