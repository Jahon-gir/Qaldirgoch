/** Qaldirgʻoch shakli (100x100 koordinatada; bosh ekran xaritasida ham ishlatiladi). */
export const SWALLOW_PATH = 'M12 38 Q34 33 50 49 Q66 33 88 38 Q69 46 56 59 L63 84 L50 70 L37 84 L44 59 Q31 46 12 38 Z'

/** Qaldirgʻoch logotipi (public/icon.svg bilan bir xil, inline: alohida soʻrov yoʻq). Bezak — ekran oʻqigichlar oʻtkazib yuboradi. */
export function Logo({ size = 84 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false" data-testid="logo" className="shrink-0">
      <rect x="0.75" y="0.75" width="98.5" height="98.5" rx="23.5" fill="#FAECE7" stroke="#F5C4B3" strokeWidth="1.5" />
      <path d={SWALLOW_PATH} fill="#D85A30" />
      <circle cx="50" cy="47" r="4.5" fill="#D85A30" />
      <circle cx="80" cy="20" r="6" fill="#EF9F27" />
    </svg>
  )
}
