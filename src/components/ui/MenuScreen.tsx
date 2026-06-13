import { GAME_TITLE, GAME_SUBTITLE } from '@/utils/constants'

interface Props {
  onStart: () => void
  onSettings: () => void
}

function Particles() {
  return (
    <div className="cg-particles" style={{
      position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 3,
    }}>
      {Array.from({ length: 40 }, (_, i) => {
        const colors = ['rgba(0,212,255,0.9)', 'rgba(157,78,221,0.9)', 'rgba(255,0,110,0.9)', 'rgba(255,255,255,0.9)']
        return (
          <div key={i} className="cg-particle" style={{
            position: 'absolute', left: `${Math.random() * 100}%`, bottom: '-10px',
            width: `${2 + Math.random() * 3}px`, height: `${2 + Math.random() * 3}px`,
            borderRadius: '50%', background: colors[Math.floor(Math.random() * 4)],
            boxShadow: `0 0 8px ${colors[Math.floor(Math.random() * 4)]}`,
            animation: `cg-particle-rise ${10 + Math.random() * 10}s ease-in-out ${Math.random() * 15}s infinite`,
          } as React.CSSProperties} />
        )
      })}
    </div>
  )
}

function Orbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      <div style={{
        position: 'absolute', width: 'min(350px, 50vw)', height: 'min(350px, 50vw)',
        borderRadius: '50%', background: 'rgba(138,43,226,0.2)', filter: 'blur(60px)',
        top: '-10%', left: '-10%',
        animation: 'cg-orb-float 12s ease-in-out infinite',
      } as React.CSSProperties} />
      <div style={{
        position: 'absolute', width: 'min(300px, 45vw)', height: 'min(300px, 45vw)',
        borderRadius: '50%', background: 'rgba(0,191,255,0.15)', filter: 'blur(60px)',
        bottom: '-10%', right: '-10%',
        animation: 'cg-orb-float 12s ease-in-out infinite -4s',
      } as React.CSSProperties} />
      <div style={{
        position: 'absolute', width: 'min(250px, 40vw)', height: 'min(250px, 40vw)',
        borderRadius: '50%', background: 'rgba(255,20,147,0.12)', filter: 'blur(60px)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        animation: 'cg-orb-float 12s ease-in-out infinite -8s',
      } as React.CSSProperties} />
    </div>
  )
}

function GridOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
      perspective: '500px', overflow: 'hidden',
    }}>
      <div style={{
        width: '100%', height: '200%',
        backgroundImage: `
          linear-gradient(rgba(100,180,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(100,180,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        transform: 'perspective(500px) rotateX(60deg)',
        transformOrigin: 'center top',
        animation: 'cg-grid-move 20s linear infinite',
      } as React.CSSProperties} />
    </div>
  )
}

export function MenuScreen({ onStart, onSettings }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1,
    }}>
      <Orbs />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 4,
        background: 'rgba(0,0,0,0.25)', pointerEvents: 'none',
      }} />
      <GridOverlay />
      <Particles />

      {/* Title: top-left */}
      <div style={{
        position: 'absolute', top: 'clamp(16px,3vw,32px)', left: 'clamp(16px,3vw,32px)', zIndex: 30,
      }}>
        <h1 style={{
          fontFamily: '"Orbitron", var(--heading-font)',
          fontSize: 'clamp(1.2rem,3.5vw,2rem)',
          fontWeight: 900, letterSpacing: '0.12em',
          textTransform: 'uppercase', margin: 0,
          background: 'linear-gradient(135deg, #00d4ff 0%, #9d4edd 50%, #ff006e 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 20px rgba(157,78,221,0.6))',
          animation: 'cg-title-glow 3s ease-in-out infinite alternate',
          lineHeight: 1.1,
        } as React.CSSProperties}>
          {GAME_TITLE}
        </h1>
        <p style={{
          fontFamily: '"Cairo", sans-serif',
          fontSize: 'clamp(0.6rem,1.2vw,0.85rem)',
          color: 'rgba(255,255,255,0.5)',
          margin: '4px 0 0',
          letterSpacing: '0.04em',
        }}>
          {GAME_SUBTITLE}
        </p>
      </div>

      {/* Buttons: bottom-center */}
      <div style={{
        position: 'absolute', bottom: 'clamp(20px,4vw,36px)',
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center',
        gap: '35px',
        zIndex: 30, direction: 'ltr',
      }}>
        {/* SETTINGS wrapper: label then button → label on LEFT */}
        <div className="cg-btn-wrapper">
          <span className="cg-label cg-label--left">
            الإعدادات
          </span>
          <button onClick={onSettings} className="cg-icon-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>

        {/* START wrapper: button then label → label on RIGHT */}
        <div className="cg-btn-wrapper">
          <button onClick={onStart} className="cg-icon-btn cg-icon-btn--active">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.92)" style={{ marginLeft: '2px' }}>
              <path d="M8 5v14l11-7z" />
            </svg>
            <span style={{
              position: 'absolute', top: '4px', right: '4px',
              width: '14px', height: '14px',
              background: 'linear-gradient(135deg,#ff5555,#dd2222)',
              borderRadius: '50%',
              border: '2.5px solid rgba(25,18,38,0.98)',
              boxShadow: '0 2px 12px rgba(255,50,50,0.75)',
              animation: 'cg-notification-pulse 2.5s infinite',
            } as React.CSSProperties} />
          </button>
          <span className="cg-label cg-label--right">
            بدء اللعبة
          </span>
        </div>
      </div>

      <style>{`
        .cg-btn-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
        }
        .cg-icon-btn {
          width: clamp(48px, 6vw, 64px);
          height: clamp(48px, 6vw, 64px);
          border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.12);
          cursor: pointer;
          flex-shrink: 0;
          background: linear-gradient(145deg, rgba(40,28,58,0.95), rgba(25,18,38,0.98));
          backdrop-filter: blur(25px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 20px rgba(100,70,150,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .cg-icon-btn:hover {
          border-color: rgba(180,150,230,0.85);
          background: linear-gradient(145deg, rgba(138,80,200,0.45), rgba(80,50,150,0.38));
          transform: scale(1.12) translateY(-4px);
          box-shadow: 0 14px 42px rgba(138,80,200,0.55), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 35px rgba(140,100,200,0.45);
        }
        .cg-icon-btn:active {
          transform: scale(0.95) translateY(0) !important;
        }
        .cg-icon-btn--active {
          border-color: rgba(130,170,255,0.78);
          background: radial-gradient(circle at center, rgba(80,140,255,0.38) 0%, rgba(60,100,220,0.28) 70%, rgba(40,28,58,0.95) 100%);
          box-shadow: 0 10px 36px rgba(80,140,255,0.58), inset 0 0 24px rgba(100,160,255,0.25), 0 0 40px rgba(80,140,255,0.35);
        }
        .cg-label {
          font-family: "Cairo", var(--heading-font);
          font-size: clamp(0.75rem, 1.2vw, 0.95rem);
          font-weight: 700;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.95);
          white-space: nowrap;
          opacity: 0;
          transition: all 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: none;
          text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 15px rgba(138,100,200,0.4);
        }
        .cg-label--right {
          transform: translateX(15px) scaleX(0.8);
        }
        .cg-label--left {
          transform: translateX(-15px) scaleX(0.8);
        }
        .cg-btn-wrapper:hover .cg-label {
          opacity: 1;
          transform: translateX(0) scaleX(1);
        }
      `}</style>

      {/* Version */}
      <div style={{
        position: 'absolute', bottom: '12px', left: '18px', zIndex: 20,
        fontFamily: '"Orbitron", var(--mono-font)',
        fontSize: 'clamp(0.6rem,0.8vw,0.72rem)',
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.08em',
        textShadow: '0 0 10px rgba(0,0,0,0.8)',
        direction: 'ltr',
      }}>
        v1.2.0
      </div>
    </div>
  )
}
