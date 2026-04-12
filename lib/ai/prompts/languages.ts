export interface OutputLanguage {
  code: string
  label: string
  nativeName: string
}

export const OUTPUT_LANGUAGES: OutputLanguage[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'de', label: 'German', nativeName: 'Deutsch' },
  { code: 'es', label: 'Spanish', nativeName: 'Español' },
  { code: 'fr', label: 'French', nativeName: 'Français' },
  { code: 'pt', label: 'Portuguese', nativeName: 'Português' },
  { code: 'it', label: 'Italian', nativeName: 'Italiano' },
  { code: 'nl', label: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', label: 'Polish', nativeName: 'Polski' },
]

export function getLanguageInstruction(langCode: string): string {
  const lang = OUTPUT_LANGUAGES.find((l) => l.code === langCode)
  if (!lang || lang.code === 'en') return ''
  return `\n\nIMPORTANT: Generate ALL output text (hook, script, caption, hashtags) in ${lang.label} (${lang.nativeName}). The source transcript may be in a different language — translate and adapt naturally, do not translate word-for-word.`
}
