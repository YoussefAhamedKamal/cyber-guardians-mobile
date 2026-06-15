export interface ChallengeMeta {
  levelId: number
  introText: string
  introCharacterName: string
  summary: string
}

export const CHALLENGE_META: ChallengeMeta[] = [
  {
    levelId: 1,
    introText: 'اليوم ستتعلم كيف تكشف الرسائل المشبوهة. تذكّر: لا تثق بأي إيميل يطلب معلومات شخصية أو يحتوي على روابط مختصرة.',
    introCharacterName: 'زين',
    summary: 'تذكّر: الرسائل المشبوهة غالبًا ما تحتوي على أخطاء إملائية وروابط مختصرة. تحقق دائماً من هوية المرسل قبل النقر.',
  },
  {
    levelId: 2,
    introText: 'كلمات المرور القوية هي خط الدفاع الأول. ستتعلم بناء كلمة مرور لا يمكن تخمينها.',
    introCharacterName: 'د. نورا',
    summary: 'كلمة المرور القوية: 12+ حرف، أرقام، رموز، أحرف كبيرة وصغيرة. لا تستخدم اسمك أو تاريخ ميلادك.',
  },
  {
    levelId: 3,
    introText: 'البرمجيات الخبيثة يمكن أن تدمر نظامك. ستعلم كيف تكتشفها وتتعامل معها.',
    introCharacterName: 'طارق',
    summary: 'البرمجيات الخبيثة تشمل الفيروسات والديدان. حدّث النظام دائماً ولا تفتح مرفقات مجهولة.',
  },
  {
    levelId: 4,
    introText: 'الجدار الناري هو حارس شبكتك. ستتعلم إعداده لحماية شبكتك من الاختراق.',
    introCharacterName: 'عمر',
    summary: 'الجدار الناري يحجب الوصول غير المصرح به. اترك المنافذ الآمنة مفتوحة وأغلق البقية.',
  },
  {
    levelId: 5,
    introText: 'التشفير يجعل بياناتك غير مقروءة للغرباء. ستتعلم كيف يعمل.',
    introCharacterName: 'د. نورا',
    summary: 'التشفير يحوّل البيانات لشكل غير مقروء بدون مفتاح فك التشفير. HTTPS يحمي اتصالاتك.',
  },
  {
    levelId: 6,
    introText: 'ثغرات الويب يمكن أن تسمح للمتسللين بسرقة بيانات المستخدمين. ستعلم كيف تصلحها.',
    introCharacterName: 'ليلى',
    summary: 'SQL Injection و XSS من أكثر الثغرات شيوعاً. استخدم Prepared Statements وتنقية المدخلات.',
  },
  {
    levelId: 7,
    introText: 'في حالة اختراق أمني، الاستجابة السريعة حاسمة. ستعلم الخطوات الصحيحة.',
    introCharacterName: 'زين',
    summary: 'الخطوة 1: العزل. الخطوة 2: التوثيق. الخطوة 3: التحقق. أبلغ فريق الأمن فوراً.',
  },
]

export function getChallengeMeta(levelId: number): ChallengeMeta | undefined {
  return CHALLENGE_META.find((m) => m.levelId === levelId)
}
