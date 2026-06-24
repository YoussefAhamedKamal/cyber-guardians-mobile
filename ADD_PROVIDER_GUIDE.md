# دليل ربط الأدوات بالمزودات — Cyber Guardians Mobile

> دليل شامل لربط أي أداة (فيديو، صور، رسوم بيانية، بحث، OCR) بمزودين متعددين
> آخر تحديث: **2026-06-24**

---

## فهرس المحتوى

1. [فهم النمط العام](#pattern)
2. [ربط توليد الصور بالمزودات](#image-providers)
3. [ربط توليد الفيديو بالمزودات](#video-providers)
4. [ربط أي أداة بمزودين جدد](#add-new-provider)
5. [ربط مزود AI_chat بأداة](#link-tool-to-ai)
6. [疑难排除](#troubleshooting)

---

## 1. فهم النمط العام {#pattern}

### كيف تعمل الأدوات متعددة المزودات

```
المستخدم ← يكتب طلب ← detectPluginRequest يكشف الأداة + المزود
                              │
                    ┌─────────┴─────────┐
                    │                   │
              pluginRequest         AI Chat
              (الأداة تعمل)       (AI يخطط)
                    │                   │
                    └─────────┬─────────┘
                              │
                    generateImage / generateVideo
                              │
                    ┌─────────┼─────────┐
                    │         │         │
              Pollinations  Puter    Stable Diffusion
              (الافتراضي)  (بديل)    (بديل)
```

### النمط الأساسي — switch statement

```typescript
// 1. حدد نوع المزود
export type ImageProvider = 'pollinations' | 'puter' | 'stable_diffusion'

// 2. الدالة الرئيسية (Gateway)
export async function generateImage(
  prompt: string,
  provider: ImageProvider = 'pollinations'  // الافتراضي
): Promise<string> {
  switch (provider) {
    case 'puter':         return generateImagePuter(prompt)
    case 'stable_diffusion': return generateImageStableDiffusion(prompt)
    case 'pollinations':
    default:              return generateImageWithPollinations(prompt)
  }
}

// 3. كل مزود له دالة خاصة
async function generateImageWithPollinations(prompt: string): Promise<string> { ... }
async function generateImagePuter(prompt: string): Promise<string> { ... }
async function generateImageStableDiffusion(prompt: string): Promise<string> { ... }
```

### المكونات الأربعة لكل أداة

| المكون | الملف | الوظيفة |
|--------|-------|---------|
| **Type** | `skillIntegration.ts` | تحديد المزودات المدعومة (union type) |
| **Gateway function** | `skillIntegration.ts` | الدالة الرئيسية التي توجه للمزود |
| **Provider functions** | `skillIntegration.ts` | دوال خاصة بكل مزود |
| **detectPluginRequest** | `skillIntegration.ts` | كشف المزود من رسالة المستخدم |

---

## 2. ربط توليد الصور بالمزودات {#image-providers}

### المزودات الحالية (3)

| المزود | النوع | المجاني؟ | الميزة |
|--------|-------|----------|--------|
| **Pollinations.ai** | API سحابي | ✅ مجاني | الافتراضي، جودة عالية |
| **Puter.js** | مكتبة JS | ✅ مجاني | يعمل في المتصفح مباشرة |
| **Stable Diffusion** | API | ✅ مجاني عبر Pollinations | نماذج Flux |

### كيف يختار المستخدم المزود

**الطريقة 1: تلقائي (الافتراضي)**
```
المستخدم: "ولّد صورة لروبوت"
→ detectPluginRequest يكشف: pluginId='image_generator', params.prompt='روبوت'
→ generateImage('روبوت', 'pollinations')  ← الافتراضي
```

**الطريقة 2: تحديد المزود في الرسالة**
```
المستخدم: "ولّد صورة لروبوت باستخدام puter"
→ detectPluginRequest يكشف: pluginId='image_generator', params.prompt='روبوت', params.provider='puter'
→ generateImage('روبوت', 'puter')
```

### الكود الكامل — توليد الصور

```typescript
// === الخطوة 1: حدد المزودات ===
export type ImageProvider = 'pollinations' | 'puter' | 'stable_diffusion'

// === الخطوة 2: الدالة الرئيسية (Gateway) ===
export async function generateImage(
  prompt: string,
  provider: ImageProvider = 'pollinations'
): Promise<string> {
  switch (provider) {
    case 'puter': return generateImagePuter(prompt)
    case 'stable_diffusion': return generateImageStableDiffusion(prompt)
    case 'pollinations':
    default: return generateImageWithPollinations(prompt)
  }
}

// === الخطوة 3: مزود Pollinations ===
export async function generateImageWithPollinations(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt)
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Date.now()}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Pollinations API error: ${response.status}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// === الخطوة 4: مزود Puter.js ===
async function generateImagePuter(prompt: string): Promise<string> {
  if (typeof puter === 'undefined' || !puter.ai?.txt2img) {
    throw new Error('Puter.js not loaded')
  }
  const blob = await puter.ai.txt2img(prompt)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// === الخطوة 5: مزود Stable Diffusion ===
async function generateImageStableDiffusion(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt)
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Stable Diffusion API error: ${response.status}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
```

---

## 3. ربط توليد الفيديو بالمزودات {#video-providers}

### المزودات الحالية (3)

| المزود | النماذج المتاحة | المجاني؟ |
|--------|-----------------|----------|
| **Pollinations.ai** | veo, seedance-pro, seedance-2.0, wan, wan-fast, wan-pro, ltx-2, grok-video-pro, nova-reel | ✅ مجاني |
| **Stable Diffusion** | wan-fast, wan, ltx-2 | ✅ مجاني عبر Pollinations |
| **LoreMotion** | ltx-2 | ✅ مجاني عبر Pollinations |

### كيف يختار المستخدم المزود والنموذج

**مثال 1: الافتراضي (Pollinations + veo)**
```
المستخدم: "ولّد فيديو لروبوت"
→ generateVideo('روبوت', 'pollinations', 'veo', 4)
```

**مثال 2: تحديد المزود**
```
المستخدم: "ولّد فيديو باستخدام stable diffusion"
→ generateVideo('روبوت', 'stable_diffusion', 'wan-fast', 4)
```

**مثال 3: تحديد النموذج**
```
المستخدم: "ولّد فيديو بـ seedance-pro"
→ generateVideo('روبوت', 'pollinations', 'seedance-pro', 4)
```

### الكود الكامل — توليد الفيديو

```typescript
// === الخطوة 1: حدد المزودات والنماذج ===
export type VideoProvider = 'pollinations' | 'stable_diffusion' | 'loremotion'

export const VIDEO_MODELS: Record<VideoProvider, string[]> = {
  pollinations: ['veo', 'seedance-pro', 'seedance-2.0', 'wan', 'wan-fast', 'wan-pro', 'ltx-2', 'grok-video-pro', 'nova-reel'],
  stable_diffusion: ['wan-fast', 'wan', 'ltx-2'],
  loremotion: ['ltx-2'],
}

// === الخطوة 2: الدالة الرئيسية (Gateway) ===
export async function generateVideo(
  prompt: string,
  provider: VideoProvider = 'pollinations',
  model?: string,
  duration = 4
): Promise<string> {
  const resolvedModel = model || (provider === 'pollinations' ? 'veo' : 'ltx-2')
  switch (provider) {
    case 'stable_diffusion': return generateVideoStableDiffusion(prompt)
    case 'loremotion': return generateVideoLoreMotion(prompt)
    case 'pollinations':
    default: return generateVideoPollinations(prompt, resolvedModel, duration)
  }
}

// === الخطوة 3: مزود Pollinations ===
async function generateVideoPollinations(prompt: string, model = 'veo', duration = 4): Promise<string> {
  const encoded = encodeURIComponent(prompt)
  const url = `https://gen.pollinations.ai/video/${encoded}?model=${model}&duration=${duration}&nologo=true`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Pollinations Video API error: ${response.status}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// === الخطوة 4: مزود Stable Diffusion ===
async function generateVideoStableDiffusion(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt)
  const url = `https://gen.pollinations.ai/video/${encoded}?model=wan-fast&duration=4&nologo=true`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Stable Video API error: ${response.status}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// === الخطوة 5: مزود LoreMotion ===
async function generateVideoLoreMotion(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt)
  const url = `https://gen.pollinations.ai/video/${encoded}?model=ltx-2&duration=4&nologo=true`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`LoreMotion API error: ${response.status}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
```

---

## 4. ربط أي أداة بمزودين جدد {#add-new-provider}

### مثال: إضافة مزود صور جديد (Replicate)

#### الخطوة 1: أضف المزود في Type

```typescript
// src/ai/skillIntegration.ts

// غيّر:
export type ImageProvider = 'pollinations' | 'puter' | 'stable_diffusion'

// إلى:
export type ImageProvider = 'pollinations' | 'puter' | 'stable_diffusion' | 'replicate'
```

#### الخطوة 2: أضف الدالة الخاصة بالمزود

```typescript
// src/ai/skillIntegration.ts

async function generateImageReplicate(prompt: string): Promise<string> {
  const apiKey = localStorage.getItem('cg-replicate-api-key') || ''
  if (!apiKey) throw new Error('Replicate API key not configured')

  // 1. أرسل الطلب
  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`,
    },
    body: JSON.stringify({
      version: 'stability-ai/sdxl:latest',
      input: { prompt },
    }),
  })

  if (!createRes.ok) throw new Error(`Replicate API error: ${createRes.status}`)
  const prediction = await createRes.json()

  // 2. انتظر النتيجة
  let result = prediction
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 2000))
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { 'Authorization': `Token ${apiKey}` },
    })
    result = await pollRes.json()
  }

  if (result.status === 'failed') throw new Error('Replicate generation failed')

  // 3. حمّل الصورة
  const imageUrl = result.output?.[0]
  if (!imageUrl) throw new Error('No image URL in response')

  const imgRes = await fetch(imageUrl)
  const blob = await imgRes.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
```

#### الخطوة 3: أضف المزود في Gateway function

```typescript
// src/ai/skillIntegration.ts

export async function generateImage(
  prompt: string,
  provider: ImageProvider = 'pollinations'
): Promise<string> {
  switch (provider) {
    case 'puter': return generateImagePuter(prompt)
    case 'stable_diffusion': return generateImageStableDiffusion(prompt)
    case 'replicate': return generateImageReplicate(prompt)  // ← أضف هذا
    case 'pollinations':
    default: return generateImageWithPollinations(prompt)
  }
}
```

#### الخطوة 4: أضف كشف المزود في detectPluginRequest

```typescript
// src/ai/skillIntegration.ts — detectPluginRequest

'image_generator': {
  // ... باقي الكود
  paramExtractors: {
    prompt: (msg): string | null => { /* ... */ },
    provider: (msg): string | null => {  // ← أضف هذا
      const lower = msg.toLowerCase()
      if (lower.includes('replicate') || lower.includes('ريبيكيت')) return 'replicate'
      if (lower.includes('puter') || lower.includes('بيوتر')) return 'puter'
      if (lower.includes('stable') || lower.includes('ستايبل')) return 'stable_diffusion'
      return 'pollinations'  // الافتراضي
    }
  }
}
```

#### الخطوة 5: اختبر

```
المستخدم: "ولّد صورة لروبوت باستخدام replicate"
→ detectPluginRequest يكشف: provider='replicate'
→ generateImage('روبوت', 'replicate')
→ generateImageReplicate('روبوت')
```

---

## 5. ربط مزود AI_chat بأداة {#link-tool-to-ai}

### كيف يُكتشف طلب الأداة من المحادثة

```
المستخدم: "ولّد فيديو لروبوت يحرس شبكة"
            │
            ▼
    detectPluginRequest()
            │
    ┌───────┴───────┐
    │               │
  keyword        param
  matching      extraction
    │               │
    └───────┬───────┘
            │
    { pluginId: 'video_generator',
      endpointId: 'generate',
      params: {
        prompt: 'روبوت يحرس شبكة',
        provider: 'pollinations',
        model: null
      }
    }
```

### هيكل detectPluginRequest لكل أداة

```typescript
const pluginKeywords: Record<string, {
  keywords: string[]           // الكلمات المفتاحية للإطلاق
  endpoint: string             // معرّف الـ endpoint
  paramExtractors: Record<string, (msg: string) => string | null>
}> = {
  'video_generator': {
    keywords: ['فيديو', 'video', 'حرّك', 'animate', 'movie'],
    endpoint: 'generate',
    paramExtractors: {
      prompt: (msg) => { /* استخراج الوصف */ },
      provider: (msg) => {
        if (msg.includes('loremotion')) return 'loremotion'
        if (msg.includes('stable')) return 'stable_diffusion'
        return 'pollinations'
      },
      model: (msg) => {
        if (msg.includes('veo')) return 'veo'
        if (msg.includes('seedance')) return 'seedance-pro'
        return null
      }
    }
  },
  // ... باقي الأدوات
}
```

### إضافة أداة جديدة بالكامل

#### الخطوة 1: أضف القالب في types/plugins.ts

```typescript
{
  id: 'music_generator',
  name: 'مولّد موسيقى',
  description: 'توليد موسيقى من النصوص',
  icon: '🎵',
  category: 'custom',
  config: {},
  endpoints: [
    {
      id: 'generate',
      name: 'توليد موسيقى',
      method: 'POST',
      path: '/generate',
      description: 'توليد موسيقى من نص',
      parameters: [
        { name: 'prompt', type: 'string', required: true, description: 'وصف الموسيقى' },
        { name: 'provider', type: 'string', required: false, description: 'المزود' },
        { name: 'duration', type: 'number', required: false, description: 'المدة بالثواني' }
      ]
    }
  ],
  auth: { type: 'none' }
},
```

#### الخطوة 2: أضف Type + Gateway + Provider functions

```typescript
// src/ai/skillIntegration.ts

export type MusicProvider = 'suno' | 'musicgen' | 'audiocraft'

export async function generateMusic(
  prompt: string,
  provider: MusicProvider = 'suno',
  duration = 30
): Promise<string> {
  switch (provider) {
    case 'musicgen': return generateMusicMusicGen(prompt, duration)
    case 'audiocraft': return generateMusicAudiocraft(prompt, duration)
    case 'suno':
    default: return generateMusicSuno(prompt, duration)
  }
}

async function generateMusicSuno(prompt: string, duration: number): Promise<string> {
  // تنفيذ عبر Suno API
  const response = await fetch('https://api.suno.ai/v1/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, duration }),
  })
  // ... معالجة الاستجابة
}
```

#### الخطوة 3: أضف كشف الأداة

```typescript
// src/ai/skillIntegration.ts — detectPluginRequest

'music_generator': {
  keywords: ['موسيقى', 'أغنية', 'music', 'song', 'لحن'],
  endpoint: 'generate',
  paramExtractors: {
    prompt: (msg) => msg.replace(/^(موسيقى|أغنية|music|song)\s*/i, ''),
    provider: (msg) => {
      if (msg.includes('suno') || msg.includes('سونو')) return 'suno'
      if (msg.includes('musicgen')) return 'musicgen'
      return 'suno'
    }
  }
}
```

#### الخطوة 4: أضف المعالجة في AIPanel.tsx

```typescript
// src/ai/AIPanel.tsx — StudentChat sendMessage

} else if (pluginRequest.pluginId === 'music_generator') {
  const musicProvider = (pluginRequest.params.provider as any) || 'suno'
  ai.setStudentStreaming(`🎵 جارٍ توليد الموسيقى (${musicProvider})...`)
  try {
    const musicDataUrl = await generateMusic(prompt, musicProvider)
    ai.addStudentMessage({
      role: 'assistant',
      content: `🎵 **موسيقى مولّدة** (${musicProvider}):\n\n${prompt}`,
      attachments: [{ name: 'generated-music.mp3', type: 'audio', content: musicDataUrl, mimeType: 'audio/mpeg', uploadStatus: 'success' }]
    })
  } catch (musicErr: any) {
    ai.addStudentMessage({ role: 'assistant', content: `🎵 **فشل توليد الموسيقى:**\n\n⚠️ ${musicErr.message}` })
  }
}
```

---

## ملخص — 5 خطوات لأي أداة

```
1. types/plugins.ts     — أضف قالب الأداة (id, name, endpoints, parameters)
2. skillIntegration.ts  — أضف Type + Gateway function + Provider functions
3. skillIntegration.ts  — أضف paramExtractors في detectPluginRequest
4. AIPanel.tsx          — أضف المعالجة في StudentChat + FacultyChat
5. اختبر               — جرّب الأمر في المحادثة
```

### القالب الجاهز

```typescript
// === 1. Type ===
export type MyToolProvider = 'provider1' | 'provider2' | 'provider3'

// === 2. Gateway function ===
export async function myTool(
  input: string,
  provider: MyToolProvider = 'provider1'
): Promise<string> {
  switch (provider) {
    case 'provider2': return myToolProvider2(input)
    case 'provider3': return myToolProvider3(input)
    case 'provider1':
    default: return myToolProvider1(input)
  }
}

// === 3. Provider functions ===
async function myToolProvider1(input: string): Promise<string> {
  const response = await fetch('https://api.provider1.com/...', { ... })
  // ... معالجة
}

async function myToolProvider2(input: string): Promise<string> {
  const response = await fetch('https://api.provider2.com/...', { ... })
  // ... معالجة
}

// === 4. detectPluginRequest ===
'my_tool': {
  keywords: ['كلمة1', 'كلمة2', 'keyword1'],
  endpoint: 'execute',
  paramExtractors: {
    input: (msg) => msg.replace(/^(كلمة1|keyword1)\s*/i, ''),
    provider: (msg) => {
      if (msg.includes('provider2')) return 'provider2'
      return 'provider1'
    }
  }
}

// === 5. AIPanel.tsx ===
} else if (pluginRequest.pluginId === 'my_tool') {
  const provider = (pluginRequest.params.provider as any) || 'provider1'
  ai.setStudentStreaming(`🔧 جارٍ التنفيذ (${provider})...`)
  try {
    const result = await myTool(prompt, provider)
    ai.addStudentMessage({ role: 'assistant', content: `✅ النتيجة: ${result}` })
  } catch (err: any) {
    ai.addStudentMessage({ role: 'assistant', content: `❌ فشل: ${err.message}` })
  }
}
```

---

##疑难排除 {#troubleshooting}

### المشكلة 1: الأداة لا تعمل

**التحقق:**
1. هل الأداة مُفعّلة في pluginStore؟
2. هل الكلمات المفتاحية صحيحة؟
3. هل detectPluginRequest يُرجع نتيجة؟

```typescript
// للتأكد، أضف console.log في detectPluginRequest
console.log('Plugin request:', { pluginId, endpointId, params })
```

### المشكلة 2: المزود لا يعمل

**التحقق:**
1. هل المزود مُضاف في switch statement؟
2. هل الدالة الخاصة بالمزود تُرجع Promise<string>؟
3. هل الـ API يُرجع استجابة صحيحة؟

```typescript
// للتأكد، أضف console.log في Gateway function
console.log('Generating with provider:', provider)
```

### المشكلة 3: المستخدم لا يستطيع اختيار المزود

**التحقق:**
1. هل paramExtractors يكشف المزود من الرسالة؟
2. هل الكلمات المفتاحية للمزود مُضافة؟

```
المستخدم: "ولّد صورة بـ replicate"
→ detectPluginRequest يجب أن يُرجع provider='replicate'
```

---

> **آخر تحديث:** 2026-06-24
> **الإصدار:** 12.0.0
> **المطور:** YoussefAhamedKamal
