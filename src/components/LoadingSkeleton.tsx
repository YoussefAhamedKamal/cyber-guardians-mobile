const shimmer = `
  @keyframes cg-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`

const skeletonBase: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'cg-shimmer 1.5s ease-in-out infinite',
  borderRadius: '8px',
}

export function ScreenSkeleton() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: '20px', padding: '32px',
    }}>
      <style>{shimmer}</style>
      <div style={{ ...skeletonBase, width: '60%', height: '32px' }} />
      <div style={{ ...skeletonBase, width: '80%', height: '16px' }} />
      <div style={{ ...skeletonBase, width: '70%', height: '16px' }} />
      <div style={{ ...skeletonBase, width: '200px', height: '200px', borderRadius: '50%' }} />
      <div style={{ ...skeletonBase, width: '50%', height: '48px', marginTop: '20px' }} />
    </div>
  )
}

export function ChallengeSkeleton() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px',
    }}>
      <style>{shimmer}</style>
      <div style={{ ...skeletonBase, width: '40%', height: '24px' }} />
      <div style={{ ...skeletonBase, width: '100%', height: '200px' }} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ ...skeletonBase, flex: 1, height: '60px' }} />
        <div style={{ ...skeletonBase, flex: 1, height: '60px' }} />
      </div>
      <div style={{ ...skeletonBase, width: '60%', height: '48px', alignSelf: 'center' }} />
    </div>
  )
}
