export interface AssessmentQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'aq1',
    question: 'ما هو أكثر أنواع التهديدات شيوعاً عبر البريد الإلكتروني؟',
    options: ['البرامج المحمولة', 'الاحتيال (Phishing)', 'الفيروسات', 'الديدان'],
    correctIndex: 1,
  },
  {
    id: 'aq2',
    question: 'أي من كلمات المرور التالية هي الأقوى؟',
    options: ['123456', 'password', 'P@ssw0rd!2024', 'ahmed1990'],
    correctIndex: 2,
  },
  {
    id: 'aq3',
    question: 'ما هو الغرض من الجدار الناري (Firewall)؟',
    options: [
      'تسريع الإنترنت',
      'حجب الإعلانات',
      'حماية الشبكة من الوصول غير المصرح به',
      'تشفير الملفات',
    ],
    correctIndex: 2,
  },
  {
    id: 'aq4',
    question: 'ما هي المصادقة الثنائية (2FA)؟',
    options: [
      'كلمة مرور مزدوجة',
      'طريقة تأكيد إضافية عند تسجيل الدخول',
      'نوع من التشفير',
      'برنامج حماية من الفيروسات',
    ],
    correctIndex: 1,
  },
  {
    id: 'aq5',
    question: 'ما هو التشفير (Encryption)؟',
    options: [
      'حذف الملفات',
      'تحويل البيانات لشكل غير مقروء لحمايتها',
      'نسخ الملفات احتياطياً',
      'حجب المواقع الضارة',
    ],
    correctIndex: 1,
  },
  {
    id: 'aq6',
    question: 'أي من هذه علامة على رسالة احتيالية؟',
    options: [
      'من جهة رسمية معروفة',
      'تحتوي على خطأ إملائي كثيف',
      'مرفقات PDF',
      'نص طويل ومفصل',
    ],
    correctIndex: 1,
  },
  {
    id: 'aq7',
    question: 'ما هي أفضل طريقة للتعامل مع البرمجيات الخبيثة؟',
    options: [
      'تجاهلها',
      'حذف الملف المصاب فوراً',
      'تشغيل ماسح الفيروسات وإزالة المصاب',
      'إعادة تشغيل الجهاز فقط',
    ],
    correctIndex: 2,
  },
  {
    id: 'aq8',
    question: 'ماذا يجب أن تفعل عند اكتشاف اختراق أمني؟',
    options: [
      'إغلاق الجهاز فوراً',
      'توثيق الحادثة والإبلاغ عنها',
      'تجاهل المشكلة',
      'مشاركة الخبر على وسائل التواصل',
    ],
    correctIndex: 1,
  },
]
