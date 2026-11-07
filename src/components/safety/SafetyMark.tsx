/** Xavfsizlik belgisi: shaffof oq qalqon ichida oq qaldirgʻoch (yoʻli Logo.tsx dagi bilan bir xil). Hammasi oq — gradient ustida. Bezak. */
export function SafetyMark({ size = 64 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false" data-testid="safety-mark" className="shrink-0">
      <path d="M50 5 L87 18 V48 C87 72 71 88 50 96 C29 88 13 72 13 48 V18 Z" fill="white" fillOpacity="0.18" stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
      <g transform="translate(50 47) scale(0.5) translate(-50 -58)" fill="white">
        <path d="M12 38 Q34 33 50 49 Q66 33 88 38 Q69 46 56 59 L63 84 L50 70 L37 84 L44 59 Q31 46 12 38 Z" />
        <circle cx="50" cy="47" r="4.5" />
        <circle cx="80" cy="20" r="6" />
      </g>
    </svg>
  )
}
