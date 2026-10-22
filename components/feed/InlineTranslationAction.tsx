'use client'

import React, { useState } from 'react'
import { Languages, Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { translateText, TranslationLang } from '@/lib/translateService'

interface InlineTranslationActionProps {
  text: string
  className?: string
  compact?: boolean
}

export function InlineTranslationAction({
  text,
  className = '',
  compact = false,
}: InlineTranslationActionProps) {
  const { language } = useTranslation()
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [isTranslated, setIsTranslated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  if (!text || text.trim().length === 0) return null

  const targetLang =
    language === 'ta' || language === 'hi' || language === 'en'
      ? (language as TranslationLang)
      : 'en'

  const getLabel = () => {
    if (loading) {
      if (targetLang === 'ta') return 'மொழிபெயர்க்கிறது...'
      if (targetLang === 'hi') return 'अनुवाद हो रहा है...'
      return 'Translating...'
    }
    if (isTranslated) {
      if (targetLang === 'ta') return 'அசலைக் காண்க'
      if (targetLang === 'hi') return 'मूल देखें'
      return 'See original'
    }
    if (targetLang === 'ta') return 'மொழிபெயர்ப்பைக் காண்க'
    if (targetLang === 'hi') return 'अनुवाद देखें'
    return 'See translation'
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (loading) return
    if (isTranslated) {
      setIsTranslated(false)
      return
    }
    if (translatedText) {
      setIsTranslated(true)
      return
    }

    setLoading(true)
    setError(false)
    const res = await translateText(text, targetLang)
    setLoading(false)

    if (res.success && res.translatedText && res.translatedText !== text) {
      setTranslatedText(res.translatedText)
      setIsTranslated(true)
    } else if (res.success && res.translatedText === text) {
      setTranslatedText(res.translatedText)
      setIsTranslated(true)
    } else {
      setError(true)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <p className={`whitespace-pre-line break-words leading-relaxed ${compact ? 'text-xs text-foreground' : 'text-xs sm:text-sm text-slate-800 dark:text-slate-200'}`}>
        {isTranslated && translatedText ? translatedText : text}
      </p>

      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors ${
          compact ? 'mt-1 text-[11px]' : 'mt-2 text-xs'
        }`}
      >
        {loading ? (
          <Loader2 className="size-3 animate-spin shrink-0" />
        ) : (
          <Languages className="size-3 shrink-0" />
        )}
        <span>
          {error
            ? targetLang === 'ta'
              ? 'கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்'
              : targetLang === 'hi'
              ? 'अनुवाद अनुपलब्ध. पुनः प्रयास करें'
              : 'Translation unavailable. Retry'
            : getLabel()}
        </span>
      </button>
    </div>
  )
}
