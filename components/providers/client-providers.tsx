'use client'

import React from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { LanguageProvider } from '@/lib/i18n'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  )
}
