import { useState, useEffect } from 'react'
import { useGameStore } from '@/store'
import { audio } from '@/systems/ProceduralAudio'

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
  { id: 'xp_boost', name: 'تعزيز XP', description: 'نقاط الخبرة 2x لمدة 5 دقائق', icon: '⚡', price: 200, type: 'xp_boost' },
  { id: 'theme_dark', name: 'سمة ليلية', description: 'خلفية ليلية مميزة', icon: '🌙', price: 300, type: 'theme' },
  { id: 'theme_neon', name: 'سمة نيون', description: 'تأثيرات نيون متوهجة', icon: '✨', price: 400, type: 'theme' },
  { id: 'title_pro', name: 'لقب المحترف', description: 'لقب "محترف الأمن" بجانب اسمك', icon: '👑', price: 500, type: 'theme' },
]

const BOUGHT_KEY = 'cg-shop-bought'

interface Props {
  onDone: () => void
}

export function Shop({ onDone }: Props) {
  const game = useGameStore()
  const [boughtItems, setBoughtItems] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(BOUGHT_KEY) || '[]') } catch { return [] }
  })
  const [message, setMessage] = useState<string | null>(null)
  const [shakeItem, setShakeItem] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(BOUGHT_KEY, JSON.stringify(boughtItems))
  }, [boughtItems])

  const handleBuy = (item: ShopItem) => {
    if (boughtItems.includes(item.id)) return
    if (game.xp < item.price) {
      audio.playWrong()
      setMessage('ليس لديك نقاط كافية!')
      setShakeItem(item.id)
      setTimeout(() => { setMessage(null); setShakeItem(null) }, 1500)
      return
    }

    game.addXp(-item.price)
    audio.playCorrect()

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
        setMessage(`تم شراء ${item.name}! 🎨`)
        break
    }
    setBoughtItems((prev) => [...prev, item.id])
    setTimeout(() => setMessage(null), 2000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      animation: 'cg-fade-in 0.3s ease-out',
    }}>
      <style>{`
        @keyframes cg-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cg-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-6px) } 75% { transform: translateX(6px) } }
        @keyframes cg-bounce { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
      `}</style>
      <div style={{
        background: 'rgba(20,20,40,0.95)',
        border: '1px solid rgba(255,215,0,0.3)',
        borderRadius: '20px', padding: '24px',
        width: '90%', maxWidth: '500px', maxHeight: '80vh',
        overflow: 'auto',
        animation: 'cg-bounce 0.3s ease-out',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
        }}>
          <h3 style={{ margin: 0, color: '#FFD700', fontSize: '20px' }}>🛒 المتجر</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#FFD700', fontSize: '14px', fontWeight: 'bold' }}>
              ⭐ {game.xp.toLocaleString()} نقطة
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
            background: message.includes('كافية') ? 'rgba(229,115,115,0.15)' : 'rgba(76,175,80,0.15)',
            border: `1px solid ${message.includes('كافية') ? 'rgba(229,115,115,0.3)' : 'rgba(76,175,80,0.3)'}`,
            color: message.includes('كافية') ? '#E57373' : '#4CAF50',
            fontSize: '14px', textAlign: 'center', marginBottom: '12px',
            animation: 'cg-bounce 0.3s ease-out',
          }}>
            {message}
          </div>
        )}

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}>
          {SHOP_ITEMS.map((item) => {
            const canAfford = game.xp >= item.price
            const isBought = boughtItems.includes(item.id)
            const isShaking = shakeItem === item.id
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
                  animation: isShaking ? 'cg-shake 0.3s ease-in-out' : undefined,
                  transition: 'all 0.2s ease',
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
                    transition: 'all 0.2s ease',
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
