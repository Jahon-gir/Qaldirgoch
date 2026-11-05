/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(--c-${v}) / <alpha-value>)`
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        bg: c('bg'), surface: c('surface'), 'surface-2': c('surface-2'), line: c('border'),
        ink: c('text'), 'ink-2': c('text-2'), 'ink-3': c('text-3'),
        accent: c('accent'), 'accent-strong': c('accent-strong'), 'accent-soft': c('accent-soft'), 'on-accent': c('on-accent'),
        tint: c('tint'), head: c('head'), 'head-line': c('head-line'), vf: c('vf'), vb: c('vb'), vink: c('vink'), vedge: c('vedge'), vbtn: c('vbtn'), 'vbtn-on': c('vbtn-on'), 'vbtn-ink': c('vbtn-ink'), warn: c('warn'), 'warn-soft': c('warn-soft'), 'warn-text': c('warn-text'), 'der-bg': c('der-bg'), der: c('der'), 'die-bg': c('die-bg'), die: c('die'), 'das-bg': c('das-bg'), das: c('das'), trust: c('trust'), 'trust-soft': c('trust-soft'), 'trust-text': c('trust-text'),
        success: c('success'), 'success-soft': c('success-soft'), 'success-text': c('success-text'),
        danger: c('danger'), 'danger-soft': c('danger-soft'), 'danger-text': c('danger-text')
      },
      borderRadius: { card: '1rem', btn: '0.875rem' }
    }
  },
  plugins: []
}
