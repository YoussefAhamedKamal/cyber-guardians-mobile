import { useState } from 'react'
import { useUIStore } from '@/store/uiStore'

interface Props {
  onDone: () => void
}

const SECTIONS = [
  {
    id: 'welcome',
    icon: '🛡️',
    title: 'مرحباً بك في Cyber Guardians!',
    content: 'لعبة تعليمية تفاعلية لتعلم أساسيات الأمن السيبراني. ستتعلم من خلال تحديات ممتعة وذكاء اصطناعي مساعد.',
  },
  {
    id: 'menu',
    icon: '🏠',
    title: 'القائمة الرئيسية',
    items: [
      'ابدأ المغامرة لاختيار المستوى',
      '🛒 المتجر: اشترِ عناصر بـ XP المكتسب',
      '✏️ عدّل اسمك',
      '📋 المهام اليومية: أكمل مهام يومية لمكافآت إضافية',
      '🏅 الشارات: تتبع إنجازاتك',
      '🏆 لوحة الصدارة: قارن نتيجتك مع اللاعبين',
      '📚 المرجع الأمني: مرجع سريع للأمن السيبراني',
    ],
  },
  {
    id: 'levels',
    icon: '🎮',
    title: 'المستويات والتحديات',
    items: [
      '7 مستويات تعليمية: من المبتدئ إلى المتقدم',
      'كل مستوى يحتوي على 3 تحديات مختلفة',
      '🎯 تحدي البطاقات: اختر الإجابة الصحيحة',
      '🔧 تحدي البناء: ابنِ خط دفاع صحيح',
      '🌀 تحدي المتاهة: انتقل بأمان',
      '🧩 تحدي السحب والإفلات: رتّب العناصر',
      '🔐 تحدي فك التشفير: حلّل الرسالة',
      '💻 تحدي إصلاح الكود: صحّح الأخطاء',
      '📝 تحدي الاستجابة: أجب على الأسئلة',
    ],
  },
  {
    id: 'gamification',
    icon: '⭐',
    title: 'نظام التقدم والمكافآت',
    items: [
      '⭐ النقاط (XP): اكسب نقاطاً من كل تحدي',
      '🏅 الرتب: مبتدئ → خبير → محترف → أسطورة',
      '❤️ الأرواح: لديك 3 أرواح لكل مستوى',
      '🔥 الكومبو: أجب بشكل صحيح متتالي لمكافآت مضاعفة',
      '📅 المكافآت اليومية: سجّل دخول يومياً',
      '🏆 الشارات: افتح إنجازات خاصة',
      '💡 التلميحات: استخدمها عند العثور على صعوبة',
    ],
  },
  {
    id: 'ai-assistant',
    icon: '🤖',
    title: 'مساعد الذكاء الاصطناعي',
    content: 'انقر على أيقونة الروبوت () في الزاوية السفلية اليمنى لفتح لوحة الذكاء الاصطناعي.',
    items: [
      '💬 طالب: اسأل أي سؤال عن الأمن السيبراني',
      '👨‍🏫 هيئة تدريس: أداة للمعلمين لإنشاء محتوى',
      '🛠️ أدوات: أدوات متقدمة للتحليل',
      '📁 مشروع: إدارة معرفة المشروع',
      '⚙️ إعدادات: تخصيص إعدادات الـ AI',
      '🎨 ثيمات: تغيير مظهر التطبيق',
    ],
  },
  {
    id: 'ai-tools',
    icon: '🛠️',
    title: 'أدوات الـ AI المتقدمة',
    items: [
      '🔌 قدرات: مهارات مخصصة للـ AI',
      '🧩 إضافات: تنفيذ مهام مع APIs خارجية',
      '📡 اتصالات: ربط مصادر بيانات خارجية',
      '🏪 سوق: تصفح وتنزيل إضافات',
      '🤖 وكيل: وكيل محلي لتنفيذ أوامر',
      '📊 إحصائيات: تحليل استخدام الـ AI',
      '📋 نسخ: إدارة سجلات المحادثة',
      '🔍 بحث: بحث ذكي في المحادثات',
      '🤝 تعاون: مشاركة وتصدير البيانات',
      '🔒 أمان: تشفير وحماية البيانات',
      '📅 تقويم: إدارة المهام والمواعيد',
      '📈 تقارير: إنشاء تقارير مخصصة',
    ],
  },
  {
    id: 'local-agent',
    icon: '🤖',
    title: 'الوكيل المحلي (Local Agent)',
    items: [
      '🔄 وكيل محلي يعمل على جهازك',
      '🔍 يدعم: Semgrep, CodeQL, Slither, LibFuzzer',
      '📁 يكتشف وينفذ أوامر من ملفات SKILL.md و plugin.json',
      '🌍 يعمل على Windows, macOS, و Linux',
      '⚡ يتصل عبر WebSocket على المنفذ 3002',
      '🛡️ بدون اتصال بالإنترنت - يعمل محلياً',
    ],
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: 'الإعدادات والتخصيص',
    items: [
      '🎨 5 ثيمات: داكن، فاتح، سايبربنك، محيط، غروب',
      '🔤 حجم الخط: عدّل حجم النص',
      '💾 حفظ تلقائي: يحفظ تقدمك تلقائياً',
      '🔇 كتم الصوت: M للصوت، B للموسيقى',
      '⌨️ Escape: العودة للقائمة الرئيسية',
      '🔒 إعدادات الأمان: تشفير وحماية البيانات',
      '📤 النسخ الاحتياطي: احفظ واستعد بياناتك',
    ],
  },
  {
    id: 'faculty',
    icon: '👨‍🏫',
    title: 'وضع هيئة التدريس',
    items: [
      '🔐 تتطلب كلمة مرور المعلم',
      '📝 إنشاء محتوى تعليمي مخصص',
      '📊 متابعة تقدم الطلاب',
      '🤖 استخدام AI لإنشاء أسئلة وتحديات',
      '📤 تصدير التقارير والنتائج',
    ],
  },
  {
    id: 'keyboard',
    icon: '⌨️',
    title: 'اختصارات لوحة المفاتيح',
    items: [
      'M: كتم/تشغيل الصوت',
      'B: كتم/تشغيل الموسيقى الخلفية',
      'Escape: العودة للقائمة الرئيسية',
      'Space: تخطي الحوارات',
    ],
  },
  {
    id: 'tips',
    icon: '💡',
    title: 'نصائح مهمة',
    items: [
      'سجّل دخول يومياً للمكافآت اليومية',
      'أكمل المهام اليومية للحصول على XP إضافي',
      'استخدم التلميحات عند العثور على صعوبة',
      'جرّب الكومبو: الإجابات الصحيحة المتتالية تضاعف النقاط',
      'احتفظ بالأرواح: لا تُجب بشكل خاطئ كثيراً',
      'استكشف المتجر لشراء عناصر مفيدة',
      'اسأل مساعد الـ AI عن أي سؤال',
    ],
  },
]

export function HelpGuide({ onDone }: Props) {
  const [currentSection, setCurrentSection] = useState(0)
  const setShowOnboarding = useUIStore((s) => s.setShowOnboarding)

  const section = SECTIONS[currentSection]
  if (!section) return null
  const isLast = currentSection === SECTIONS.length - 1
  const isFirst = currentSection === 0

  const handleNext = () => {
    if (isLast) {
      setShowOnboarding(false)
      onDone()
    } else {
      setCurrentSection((c) => c + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentSection((c) => c - 1)
    }
  }

  const handleSkip = () => {
    setShowOnboarding(false)
    onDone()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,20,40,0.98), rgba(10,10,30,0.98))',
        border: '1px solid rgba(79,195,247,0.3)',
        borderRadius: '24px', padding: '32px',
        width: '90%', maxWidth: '480px', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 0 40px rgba(79,195,247,0.15)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>{section.icon}</span>
            <div>
              <div style={{
                fontSize: '11px', color: '#4FC3F7',
                fontWeight: 'bold', letterSpacing: '1px',
              }}>
                {currentSection + 1} / {SECTIONS.length}
              </div>
            </div>
          </div>
          <button
            onClick={handleSkip}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px', padding: '6px 14px',
              color: '#aaa', cursor: 'pointer', fontSize: '12px',
            }}
          >
            تخطي
          </button>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '3px', background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px', marginBottom: '24px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${((currentSection + 1) / SECTIONS.length) * 100}%`,
            background: 'linear-gradient(90deg, #4FC3F7, #00E676)',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', marginBottom: '24px' }}>
          <h2 style={{
            margin: '0 0 16px', color: '#fff',
            fontSize: '20px', fontWeight: 'bold',
          }}>
            {section.title}
          </h2>

          {section.content && (
            <p style={{
              margin: '0 0 16px', color: '#aaa',
              fontSize: '14px', lineHeight: '1.7',
            }}>
              {section.content}
            </p>
          )}

          {section.items && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {section.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '10px 14px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span style={{ fontSize: '14px', marginTop: '1px' }}>•</span>
                  <span style={{
                    color: '#ddd', fontSize: '13px', lineHeight: '1.6',
                  }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div style={{
          display: 'flex', gap: '12px', justifyContent: 'flex-end',
        }}>
          {!isFirst && (
            <button
              onClick={handlePrev}
              style={{
                padding: '10px 20px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#aaa', cursor: 'pointer', fontSize: '14px',
              }}
            >
              السابق
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              padding: '10px 24px', borderRadius: '12px',
              border: 'none',
              background: isLast
                ? 'linear-gradient(135deg, #00E676, #4FC3F7)'
                : 'linear-gradient(135deg, #4FC3F7, #00E676)',
              color: isLast ? '#000' : '#000',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
              boxShadow: '0 4px 15px rgba(79,195,247,0.3)',
            }}
          >
            {isLast ? 'ابدأ المغامرة!' : 'التالي'}
          </button>
        </div>
      </div>
    </div>
  )
}
