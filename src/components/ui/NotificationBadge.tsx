interface Props {
  count: number
  color?: string
}

export function NotificationBadge({ count, color = '#FF4444' }: Props) {
  if (count <= 0) return null

  return (
    <span style={{
      position: 'absolute', top: '-6px', right: '-6px',
      minWidth: '18px', height: '18px',
      background: color,
      borderRadius: '9px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '10px', fontWeight: 'bold',
      color: '#fff', padding: '0 4px',
      border: '2px solid rgba(0,0,0,0.3)',
    }}>
      {count > 99 ? '99+' : count}
    </span>
  )
}
