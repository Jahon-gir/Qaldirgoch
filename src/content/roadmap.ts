/**
 * Germaniya · Ausbildung yoʻli bosqichlari (TZ, 3-boʻlim).
 * Nomlar lugʻatda: step.<id>. Xarajat, muddat va manbalar tasdiqlangan kontent bilan keyin qoʻshiladi.
 */
export const AUSBILDUNG_STEPS = ['profil', 'til', 'sertifikat', 'hujjatlar', 'joy', 'shartnoma', 'viza', 'jonash', 'germaniyada', 'ish'] as const

export type StepId = (typeof AUSBILDUNG_STEPS)[number]
export const stepKey = (id: StepId) => `step.${id}` as const
