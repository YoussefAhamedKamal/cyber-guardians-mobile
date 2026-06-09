import type { LevelData } from '@/types'

export const levels: LevelData[] = [
  {
    id: 1,
    title: 'رسالة مشبوهة',
    subtitle: 'التصيد الإلكتروني',
    threat: 'phishing',
    challengeType: 'cards',
    focusCharacterId: 'zayn',
    intro: [
      { speakerId: 'zayn', text: 'يا جماعة، شيكوا على الإيميل هذا. شكله غريب.' },
      { speakerId: 'nora', text: 'رابط مختصر، أخطاء إملائية، طلب عاجل — كل علامات التصيد موجودة.' },
      { speakerId: 'zayn', text: 'لازم نعلّم الموظفين كيف يفرقون قبل لا أحد يضغط على رابط خطير.' },
      { speakerId: 'system', text: '🚨 الهدف: ميّز الإيميلات الأمنة من إيميلات التصيد قبل فوات الأوان!' },
    ],
    outro: [
      { speakerId: 'zayn', text: 'أحسنت! كل الإيميلات المشبوهة تم اكتشافها.' },
      { speakerId: 'nora', text: 'هذا أول درس: لا تثق بأي إيميل يطلب معلومات شخصية.' },
      { speakerId: 'zayn', text: 'تم تطبيق أول معيار أمان: التدريب على التصيد الإلكتروني ✅' },
    ],
    challengeData: {
            "phishingEmails": [
                  {
                        "id": "e1",
                        "from": "hr@nexgen-dynamics.com",
                        "subject": "تحديث سياسة الإجازات",
                        "body": "مرحباً، تم تحديث سياسة الإجازات. يرجى مراجعة المرفق.",
                        "isPhishing": false,
                        "reason": "إيميل رسمي من الموارد البشرية بدون طلب معلومات"
                  },
                  {
                        "id": "e2",
                        "from": "security@nexgen-dynamics.com",
                        "subject": "تغيير كلمة المرور",
                        "body": "عزيزي الموظف، بسبب تحديث أمني، يرجى إرسال كلمة مرورك الحالية إلى هذا الرابط: http://bit.ly/2fake",
                        "isPhishing": true,
                        "reason": "رابط مختصر مشبوه وطلب كلمة المرور — شركة حقيقية لا تطلب كلمة سرك"
                  },
                  {
                        "id": "e3",
                        "from": "admin@bank-secure.com",
                        "subject": "حسابك البنكي مغلق",
                        "body": "تم إغلاق حسابك البنكي. اضغط هنا لاستعادته: http://bit.ly/3scam",
                        "isPhishing": true,
                        "reason": "تهديد بإغلاق الحساب ورابط خارجي — أسلوب التخويف المعتاد"
                  },
                  {
                        "id": "e4",
                        "from": "noreply@nexgen-dynamics.com",
                        "subject": "اجتماع الفريق الأسبوعي",
                        "body": "السلام عليكم، الاجتماع الأسبوعي يوم الخميس الساعة 10 صباحاً في قاعة الاجتماعات.",
                        "isPhishing": false,
                        "reason": "إيميل داخلي عادي بدون روابط أو طلبات"
                  },
                  {
                        "id": "e5",
                        "from": "ceo@nexgen-dynamics.com",
                        "subject": "طلب عاجل جداً",
                        "body": "أنا في اجتماع مع العملاء. أرسل لي 5000 دولار عن طريق ويسترن يونيون وراح أردها بعد الاجتماع.",
                        "isPhishing": true,
                        "reason": "طلب تحويل مالي عاجل من المدير — أسلوب انتحال الشخصية"
                  },
                  {
                        "id": "e6",
                        "from": "it-support@nexgen.com",
                        "subject": "تحديث أمني عاجل",
                        "body": "عزيزي المستخدم، يرجى تحديث كلمة المرور عبر الرابط: https://portal.nexgen-dynamics.com/reset",
                        "isPhishing": false,
                        "reason": "رابط رسمي مشفر (HTTPS) ودعوة لتحديث كلمة المرور بشكل آمن"
                  }
            ]
      },
  },
  {
    id: 2,
    title: 'الباب المفتوح',
    subtitle: 'كلمات المرور',
    threat: 'passwords',
    challengeType: 'build',
    focusCharacterId: 'nora',
    intro: [
      { speakerId: 'nora', text: 'يا للأسف! حسابات الموظفين كلها بكلمة مرور "123456"!' },
      { speakerId: 'omar', text: 'ههههههه … أوف. هذا أسوأ من أن تركه مفتوح.' },
      { speakerId: 'nora', text: 'لازم نبني نظام كلمات مرور قوية. وبسرعة!' },
      { speakerId: 'system', text: '🔐 الهدف: ابنِ كلمات مرور قوية واختبر قوتها!' },
    ],
    outro: [
      { speakerId: 'nora', text: 'أحسنت! كل الحسابات أصبحت محمية بكلمات مرور قوية.' },
      { speakerId: 'omar', text: 'حلو. بس تذكر: longer is stronger!' },
      { speakerId: 'nora', text: 'معيار الأمان الثاني: سياسة كلمات مرور صارمة ✅' },
    ],
    challengeData: {
            "passwordRules": [
                  {
                        "type": "length",
                        "label": "8 أحرف على الأقل",
                        "satisfied": false
                  },
                  {
                        "type": "uppercase",
                        "label": "حرف كبير واحد على الأقل",
                        "satisfied": false
                  },
                  {
                        "type": "number",
                        "label": "رقم واحد على الأقل",
                        "satisfied": false
                  },
                  {
                        "type": "symbol",
                        "label": "رمز خاص واحد على الأقل (!@#$%)",
                        "satisfied": false
                  }
            ]
      },
  },
  {
    id: 3,
    title: 'الضيف غير المرغوب',
    subtitle: 'البرمجيات الخبيثة',
    threat: 'malware',
    challengeType: 'maze',
    focusCharacterId: 'tariq',
    intro: [
      { speakerId: 'tariq', text: '… شيء يتحرك في الشبكة.' },
      { speakerId: 'zayn', text: 'ماله داعي الصوت المخيف هذا يا طارق.' },
      { speakerId: 'tariq', text: 'ما أخوّف. ملف غريب يتنقل بين الأقسام. لازم نعزله قبل ما يمسح البيانات.' },
      { speakerId: 'system', text: '🦠 الهدف: تعقب الملف الخبيث وعزله في المنطقة الآمنة!' },
    ],
    outro: [
      { speakerId: 'tariq', text: 'تم العزل. الملف تحته خطير — كان رح يمسح كل شي.' },
      { speakerId: 'zayn', text: 'الله ستر. معيار الأمان الثالث: نظام كشف البرمجيات الخبيثة ✅' },
    ],
    challengeData: {
            "mazeGrid": [
                  [
                        {
                              "x": 0,
                              "y": 0,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 1,
                              "y": 0,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 2,
                              "y": 0,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 3,
                              "y": 0,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 4,
                              "y": 0,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 5,
                              "y": 0,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 6,
                              "y": 0,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        }
                  ],
                  [
                        {
                              "x": 0,
                              "y": 1,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 1,
                              "y": 1,
                              "isMalware": false,
                              "isWall": true,
                              "isEndpoint": false
                        },
                        {
                              "x": 2,
                              "y": 1,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 3,
                              "y": 1,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 4,
                              "y": 1,
                              "isMalware": true,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 5,
                              "y": 1,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 6,
                              "y": 1,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        }
                  ],
                  [
                        {
                              "x": 0,
                              "y": 2,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 1,
                              "y": 2,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 2,
                              "y": 2,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 3,
                              "y": 2,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 4,
                              "y": 2,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 5,
                              "y": 2,
                              "isMalware": true,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 6,
                              "y": 2,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        }
                  ],
                  [
                        {
                              "x": 0,
                              "y": 3,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 1,
                              "y": 3,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 2,
                              "y": 3,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 3,
                              "y": 3,
                              "isMalware": false,
                              "isWall": true,
                              "isEndpoint": false
                        },
                        {
                              "x": 4,
                              "y": 3,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 5,
                              "y": 3,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 6,
                              "y": 3,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        }
                  ],
                  [
                        {
                              "x": 0,
                              "y": 4,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 1,
                              "y": 4,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 2,
                              "y": 4,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 3,
                              "y": 4,
                              "isMalware": true,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 4,
                              "y": 4,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 5,
                              "y": 4,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 6,
                              "y": 4,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        }
                  ],
                  [
                        {
                              "x": 0,
                              "y": 5,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 1,
                              "y": 5,
                              "isMalware": true,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 2,
                              "y": 5,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 3,
                              "y": 5,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 4,
                              "y": 5,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 5,
                              "y": 5,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 6,
                              "y": 5,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        }
                  ],
                  [
                        {
                              "x": 0,
                              "y": 6,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 1,
                              "y": 6,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 2,
                              "y": 6,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": true
                        },
                        {
                              "x": 3,
                              "y": 6,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 4,
                              "y": 6,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        },
                        {
                              "x": 5,
                              "y": 6,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": true
                        },
                        {
                              "x": 6,
                              "y": 6,
                              "isMalware": false,
                              "isWall": false,
                              "isEndpoint": false
                        }
                  ]
            ]
      },
  },
  {
    id: 4,
    title: 'الثغرة في الجدار',
    subtitle: 'أمن الشبكات',
    threat: 'network',
    challengeType: 'dragdrop',
    focusCharacterId: 'omar',
    intro: [
      { speakerId: 'omar', text: '(يمضغ شيبس) أممم … فيه شبكة منزلية موصولة على شبكة الشركة.' },
      { speakerId: 'layla', text: 'إيش دخل المنزلية في شبكة الشركة؟!' },
      { speakerId: 'omar', text: 'أحد الموظفين وصل راوتر بيته عشان يشتغل عن بُعد. ثغرة مفتوحة على قد الدنيا.' },
      { speakerId: 'system', text: '🌐 الهدف: ابنِ جدار ناري وأغلق كل المنافذ المفتوحة!' },
    ],
    outro: [
      { speakerId: 'omar', text: 'ولا منفذ مفتوح. شبكة الشركة نظيفة.' },
      { speakerId: 'layla', text: 'معيار الأمان الرابع: جدار ناري محكم ✅' },
    ],
    challengeData: {
            "firewallPorts": [
                  {
                        "id": "p1",
                        "name": "HTTP (تصفح الويب)",
                        "port": 80,
                        "status": "open",
                        "isCritical": false
                  },
                  {
                        "id": "p2",
                        "name": "SSH (تحكم عن بُعد)",
                        "port": 22,
                        "status": "open",
                        "isCritical": true
                  },
                  {
                        "id": "p3",
                        "name": "FTP (نقل ملفات)",
                        "port": 21,
                        "status": "open",
                        "isCritical": false
                  },
                  {
                        "id": "p4",
                        "name": "DNS (أسماء النطاقات)",
                        "port": 53,
                        "status": "open",
                        "isCritical": true
                  },
                  {
                        "id": "p5",
                        "name": "Telnet (قديم جداً)",
                        "port": 23,
                        "status": "open",
                        "isCritical": false
                  },
                  {
                        "id": "p6",
                        "name": "HTTPS (تصفح آمن)",
                        "port": 443,
                        "status": "open",
                        "isCritical": true
                  }
            ]
      },
  },
  {
    id: 5,
    title: 'الرسالة المشفرة',
    subtitle: 'التشفير',
    threat: 'encryption',
    challengeType: 'decrypt',
    focusCharacterId: 'nora',
    intro: [
      { speakerId: 'nora', text: 'اعترضت رسالة غريبة. مشفرة. لكني أعرف هذه الخوارزمية.' },
      { speakerId: 'zayn', text: 'تقدري تفكّينها؟' },
      { speakerId: 'nora', text: 'أقدر. لكن بدي مساعدتكم. بدنا نطابق المفاتيح ونفك الشفرة.' },
      { speakerId: 'system', text: '🔑 الهدف: فك تشفير الرسالة قبل وصولها للجهة الخطأ!' },
    ],
    outro: [
      { speakerId: 'nora', text: 'تم فك التشفير. الرسالة تقول إن VAX يخططون لهجوم كبير.' },
      { speakerId: 'zayn', text: 'معيار الأمان الخامس: تشفير جميع الاتصالات ✅' },
    ],
    challengeData: {
            "cipher": {
                  "encrypted": "VHFXUH LV VHFXUH",
                  "hint": "هذا تشفير Caesar shift. كم حرفاً إلى الخلف؟",
                  "shift": 3,
                  "solution": "SECURE IS SECURE"
            }
      },
  },
  {
    id: 6,
    title: 'الموقع المخترق',
    subtitle: 'أمن الويب',
    threat: 'websec',
    challengeType: 'codefix',
    focusCharacterId: 'layla',
    intro: [
      { speakerId: 'layla', text: 'الموقع الرئيسي للشركة … مخترق. أحدهم حقن كود خبيث.' },
      { speakerId: 'omar', text: '(يوقف أكل) يا ويل اللي سواها!' },
      { speakerId: 'layla', text: 'ثغرات SQL Injection و XSS. لازم نصلح الكود قبل ما ينهار الموقع.' },
      { speakerId: 'system', text: '💻 الهدف: أصلح ثغرات الكود في موقع الشركة!' },
    ],
    outro: [
      { speakerId: 'layla', text: 'تم إصلاح كل الثغرات. الموقع الآن آمن.' },
      { speakerId: 'omar', text: 'معيار الأمان السادس: مراجعة أمنية للكود ✅' },
    ],
    challengeData: {
            "vulnCodes": [
                  {
                        "id": "v1",
                        "language": "SQL",
                        "code": "SELECT * FROM users WHERE username = '$username' AND password = '$password'",
                        "vulnerability": "SQL Injection — المتسلل يقدر يحقن كود في استعلام قاعدة البيانات",
                        "fix": "استخدام parameterized statements بدلاً من concatenation",
                        "options": [
                              "SELECT * FROM users WHERE username = ? AND password = ?",
                              "SELECT * FROM users WHERE username = \"$username\" AND password = \"$password\"",
                              "SELECT * FROM users",
                              "DELETE FROM users WHERE username = '$username'"
                        ],
                        "correctIndex": 0
                  },
                  {
                        "id": "v2",
                        "language": "JavaScript",
                        "code": "document.getElementById(\"output\").innerHTML = userInput;",
                        "vulnerability": "XSS — المتسلل يقدر يحقن JavaScript خبيث في الصفحة",
                        "fix": "استخدام textContent بدلاً من innerHTML أو تعقيم المدخلات",
                        "options": [
                              "document.getElementById(\"output\").textContent = userInput;",
                              "document.getElementById(\"output\").innerHTML = \"<b>\" + userInput + \"</b>\";",
                              "fetch(\"/api?input=\" + userInput)",
                              "eval(userInput)"
                        ],
                        "correctIndex": 0
                  }
            ]
      },
  },
  {
    id: 7,
    title: 'الهجوم الأخير',
    subtitle: 'الاستجابة للاختراق',
    threat: 'incident',
    challengeType: 'response',
    focusCharacterId: 'zayn',
    intro: [
      { speakerId: 'system', text: '🚨 إنذار عام! هجوم منسق على جميع أنظمة الشركة!' },
      { speakerId: 'zayn', text: 'هذي لحظتنا. كل فريق الأمن يتحد. نطبق كل المعايير اللي تعلمناها.' },
      { speakerId: 'nora', text: 'أنصح بتفعيل بروتوكول الطوارئ 7-1.' },
      { speakerId: 'omar', text: 'الشبكات تحت السيطرة … أغلقت كل المنافذ.' },
      { speakerId: 'tariq', text: 'لا يوجد برمجيات خبيثة جديدة. النظام نظيف.' },
      { speakerId: 'layla', text: 'الموقع آمن. مافي ثغرات.' },
      { speakerId: 'zayn', text: 'خلصنا. VAX فشلوا. الشركة آمنة.' },
      { speakerId: 'system', text: '🏆 الهدف: نسّق الاستجابة مع كل الفريق واطرد المخترق!' },
    ],
    outro: [
      { speakerId: 'zayn', text: 'أحسنت يا بطل! أنت الآن حارس أمن سيبراني حقيقي.' },
      { speakerId: 'nora', text: '7 معايير أمان. شركة NexGen Dynamics أصبحت أيقونة.' },
      { speakerId: 'omar', text: 'خلصت الشيبس. نستاهل راحة. 🏆' },
      { speakerId: 'tariq', text: '… عمل جيد.' },
      { speakerId: 'layla', text: 'من قال إن الأمن السيبراني مو ممتع؟ 😄' },
      { speakerId: 'system', text: '🎉 Cyber Guardians — المهمة اكتملت. أبطال الأمن السيبراني!' },
    ],
    challengeData: {
            "incidentSteps": [
                  {
                        "id": "i1",
                        "question": "أول خطوة عند اكتشاف الاختراق؟",
                        "options": [
                              "عزل الأنظمة المصابة عن الشبكة",
                              "إيقاف تشغيل كل السيرفرات",
                              "إرسال إيميل للموظفين بالخبر",
                              "حذف كل الملفات"
                        ],
                        "correctIndex": 0,
                        "explanation": "عزل الأنظمة يمنع انتشار الاختراق لباقي الشبكة"
                  },
                  {
                        "id": "i2",
                        "question": "بعد العزل، وش تسوي؟",
                        "options": [
                              "توثيق كل الأدلة (logs, timestamps, IPs)",
                              "إعادة تشغيل الأنظمة",
                              "إرسال تهديد للمخترق",
                              "تجاهل الموضوع"
                        ],
                        "correctIndex": 0,
                        "explanation": "توثيق الأدلة مهم للتحليل القانوني والتقني لاحقاً"
                  },
                  {
                        "id": "i3",
                        "question": "كيف تتأكد إن الاختراق انتهى؟",
                        "options": [
                              "فحص جميع الأنظمة وتغيير كل كلمات المرور",
                              "تثبيت لعبة مضادة للفيروسات",
                              "إرسال إيميل شكر للفريق",
                              "إغلاق الشركة"
                        ],
                        "correctIndex": 0,
                        "explanation": "الفحص الشامل وتغيير كلمات المرور يضمن عدم وجود باب خلفي"
                  }
            ]
      },
  },
]
