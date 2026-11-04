/** Qaldirgʻoch logotipi (public/icon.svg bilan bir xil, inline: alohida soʻrov yoʻq). Bezak — ekran oʻqigichlar oʻtkazib yuboradi. */
export function Logo({ size = 84 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false" data-testid="logo" className="shrink-0">
      <rect width="100" height="100" rx="24" fill="#FAECE7" />
      <path d="M12 38 Q34 33 50 49 Q66 33 88 38 Q69 46 56 59 L63 84 L50 70 L37 84 L44 59 Q31 46 12 38 Z" fill="#D85A30" />
      <circle cx="50" cy="47" r="4.5" fill="#D85A30" />
      <circle cx="80" cy="20" r="6" fill="#EF9F27" />
    </svg>
  )
}
