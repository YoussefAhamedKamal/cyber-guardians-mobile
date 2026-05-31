import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const baseStyle: React.CSSProperties = {
  padding: '12px 32px',
  borderRadius: 'var(--custom-border-radius)',
  border: 'none',
  fontSize: '18px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: 'inherit',
}

const variants: Record<string, React.CSSProperties> = {
  primary: { background: 'var(--accent-color)', color: '#0a0a1a' },
  secondary: { background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'var(--custom-border-width) solid var(--custom-border-color)' },
  ghost: { background: 'transparent', color: 'var(--accent-color)' },
}

export function Button({ variant = 'primary', style, ...props }: ButtonProps) {
  return (
    <button
      style={{ ...baseStyle, ...variants[variant], ...style }}
      {...props}
    />
  )
}
