import type { ReactNode } from 'react'

interface ModalProps {
  children: ReactNode
  onClose?: () => void
}

export function Modal({ children, onClose }: ModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a2e',
          padding: '32px', borderRadius: 'var(--custom-border-radius)',
          maxWidth: '500px', width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
