import { useState } from 'react'
import { useGameStore } from '@/store'

interface ShopItem {
  id: string
  name: string
  description: string
  icon: string
  price: number
  type: 'hearts' | 'hints' | 'xp_boost' | 'theme'
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'hearts_refill', name: 'تعبئة القلوب', description: 'استعد 5 قلوب فوراً', icon: '❤️', price: 100, type: 'hearts' },
  { id: 'hints_pack', name: 'حزمة تلميحات', description: 'احصل على 3 تلميحات إضافية', icon: '💡', price: 150, type: 'hints' },
  { id: 'xp_boost', name: 'تعزيز XP', description: 'نقاط الخبرة接下来 2x لمدة 5 دقائق', icon: '⚡', price: 200, type: 'xp_boost' },
  { id: 'theme_dark', name: 'سمة ليلية', description: 'خلفية ليلية مميزة', icon: '🌙', price: 300, type: 'theme' },
  { id: 'theme_neon', name: 'سمة نيون', description: 'تأثيرات نيون متوهجة', icon: '✨', price: 400, type: 'theme' },
  { id: 'title_pro', name: 'لقب المحترف', description: 'القب "محترف الأمن" بجانب اسمك', icon: '👑', price: 500, type: 'theme' },
]

interface Props {
  onDone: () => void
}

export function Shop({ onDone }: Props) {
  const game = useGameStore()
  const [boughtItems, setBoughtItems] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const handleBuy = (item: ShopItem) => {
    if (game.totalScore < item.price) {
      setMessage('ليس لديك نقاط كافية!')
      setTimeout(() => setMessage(null), 2000)
      return
    }

    // Deduct points
    const currentXp = game.xp
    game.addXp(-item.price)

    // Apply effect
    switch (item.type) {
      case 'hearts':
        game.resetHearts()
        setMessage('تم تعبئة القلوب! ❤️')
        break
      case 'hints':
        setMessage('تم إضافة التلميحات! 💡')
        break
      case 'xp_boost':
        setMessage('تعزيز XP مفعّل! ⚡')
        break
      case 'theme':
        setBoughtItems([...boughtItems, item.id])
        setMessage(`تم شراء ${item.name}! 🎨`)
        break
    }
    setTimeout(() => setMessage(null), 2000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        background: 'rgba(20,20,40,0.95)',
        border: '1px solid rgba(255,215,0,0.3)',
        borderRadius: '20px', padding: '24px',
        width: '90%', maxWidth: '500px', maxHeight: '80vh',
        overflow: 'auto',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
        }}>
          <h3 style={{ margin: 0, color: '#FFD700', fontSize: '20px' }}>🛒 المتجر</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#FFD700', fontSize: '14px' }}>
              ⭐ {game.totalScore.toLocaleString()} نقطة
            </span>
            <button
              onClick={onDone}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px', padding: '6px 16px',
                color: '#fff', cursor: 'pointer', fontSize: '14px',
              }}
            >
              إغلاق
            </button>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '10px', borderRadius: '10px',
            background: 'rgba(76,175,80,0.15)',
            border: '1px solid rgba(76,175,80,0.3)',
            color: '#4CAF50', fontSize: '14px',
            textAlign: 'center', marginBottom: '12px',
          }}>
            {message}
          </div>
        )}

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}>
          {SHOP_ITEMS.map((item) => {
            const canAfford = game.totalScore >= item.price
            const isBought = boughtItems.includes(item.id)
            return (
              <div
                key={item.id}
                style={{
                  padding: '16px', borderRadius: '14px',
                  background: isBought ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.05)',
                  border: isBought
                    ? '1px solid rgba(76,175,80,0.3)'
                    : '1px solid rgba(255,255,255,0.1)',
                  opacity: isBought ? 0.6 : 1,
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
                <div style={{
                  fontSize: '14px', fontWeight: 'bold',
                  color: '#fff', marginBottom: '4px',
                }}>
                  {item.name}
                </div>
                <div style={{
                  fontSize: '11px', color: '#888',
                  marginBottom: '10px', lineHeight: '1.4',
                }}>
                  {item.description}
                </div>
                <button
                  onClick={() => handleBuy(item)}
                  disabled={isBought || !canAfford}
                  style={{
                    width: '100%', padding: '8px',
                    borderRadius: '8px', border: 'none',
                    background: isBought
                      ? 'rgba(76,175,80,0.2)'
                      : canAfford
                        ? 'linear-gradient(135deg, #FFD700, #FFA000)'
                        : 'rgba(255,255,255,0.1)',
                    color: isBought ? '#4CAF50' : canAfford ? '#000' : '#888',
                    fontWeight: 'bold', fontSize: '12px',
                    cursor: isBought || !canAfford ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isBought ? '✓ مملوك' : `⭐ ${item.price}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
