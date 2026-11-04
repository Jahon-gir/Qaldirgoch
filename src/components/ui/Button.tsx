import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'trust' | 'link'

const styles: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent active:opacity-90',
  secondary: 'bg-surface text-accent-strong border-2 border-accent',
  trust: 'bg-trust text-surface active:opacity-90',
  link: 'text-trust-text underline-offset-4 hover:underline'
}

export function Button({ variant = 'primary', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`min-h-[44px] w-full rounded-btn px-4 py-3 text-base font-semibold transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    />
  )
}
