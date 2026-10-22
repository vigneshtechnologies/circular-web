export type TranslationLang = 'en' | 'ta' | 'hi'

const translationCache: Record<string, string> = {}

/**
 * Translates text to target language ('en' | 'ta' | 'hi') using Google Translate public API.
 * Includes in-memory caching to prevent repeated network requests.
 */
export async function translateText(
  text: string,
  targetLang: TranslationLang = 'en'
): Promise<{ success: boolean; translatedText: string; sourceLang?: string }> {
  const clean = text?.trim()
  if (!clean) {
    return { success: false, translatedText: text }
  }

  const cacheKey = `${targetLang}_${clean}`
  if (translationCache[cacheKey]) {
    return { success: true, translatedText: translationCache[cacheKey] }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      clean
    )}`

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return { success: false, translatedText: text }
    }

    const data = await response.json()
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((segment: any) => (Array.isArray(segment) ? segment[0] : ''))
        .join('')
        .trim()

      const detectedSource = typeof data[2] === 'string' ? data[2] : undefined

      if (translated) {
        translationCache[cacheKey] = translated
        return { success: true, translatedText: translated, sourceLang: detectedSource }
      }
    }

    return { success: false, translatedText: text }
  } catch (err) {
    return { success: false, translatedText: text }
  }
}
