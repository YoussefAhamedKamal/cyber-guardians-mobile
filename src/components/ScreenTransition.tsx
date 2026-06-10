import { type ReactNode } from 'react'

const styles = `
  @keyframes cg-fade-in {
    from { opacity: 0; transform: scale(0.97); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes cg-fade-out {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.97); }
  }
  .cg-screen-enter {
    animation: cg-fade-in 0.25s ease-out forwards;
  }
  .cg-screen-exit {
    animation: cg-fade-out 0.15s ease-in forwards;
  }
`

interface Props {
  children: ReactNode
  screenKey: string
}

export function ScreenTransition({ children, screenKey }: Props) {
  return (
    <>
      <style>{styles}</style>
      <div key={screenKey} className="cg-screen-enter" style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
    </>
  )
}
