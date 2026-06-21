import type { AIMessage } from '@/types/ai'
import { sendChatMessage } from './api'
import { DEEPTHINK_SYSTEM_PROMPT } from './prompts'

const THINK_PROMPT = `أنت مساعد ذكي متخصص في التفكير العميق. مهمتك تحليل السؤال بدقة قبل الإجابة.

خطوات التفكير المطلوبة:
1. حلل السؤال وافهمه بدقة
2. حدد المفاهيم والمصطلحات المتعلقة
3. فكك السؤال إلى أجزاء أصغر
4. حلل كل جزء على حدة
5. اربط الأجزاء ببعضها

أجب بالتفصيل مع شرح كل خطوة تفكيرك.`

const REVIEW_PROMPT = `أنت مراجع ذكي. مهمتك مراجعة التحليل السابق واكتشاف الأخطاء أو النقاط المفقودة.

راجع التحليل وحدد:
1. هل هناك أخطاء منطقية؟
2. هل هناك نقاط مهمة لم تُذكر؟
3. هل التحليل شامل ودقيق؟
4. ما هي النقاط التي يمكن تحسينها؟

قدم ملاحظاتك بالتفصيل.`

const FINAL_ANSWER_PROMPT = `بناءً على التحليل والمراجعة السابقة، قدم إجابة نهائية شاملة ودقيقة.

متطلبات الإجابة:
1. كن واضحاً ومحدداً
2. استخدم أمثلة توضيحية إذا لزم الأمر
3. اشرح المصطلحات التقنية ببساطة
4. اختم بخلاصة موجزة

أجب باللغة العربية.`

export interface DeepthinkResult {
  thinking: string
  review: string
  answer: string
  fullText: string
}

async function callAI(
  providerId: string,
  modelId: string,
  messages: AIMessage[],
  apiKey: string,
  customBaseUrl: string,
  systemPrompt: string,
  useDirectApi: boolean
): Promise<string> {
  const enhancedMessages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.filter((m) => m.role !== 'system'),
  ]

  let result = ''
  const gen = sendChatMessage(
    providerId,
    modelId,
    enhancedMessages,
    apiKey,
    customBaseUrl,
    undefined,
    useDirectApi
  )
  result = await gen
  return result
}

export async function deepthink(
  providerId: string,
  modelId: string,
  messages: AIMessage[],
  apiKey: string,
  customBaseUrl: string,
  useDirectApi: boolean,
  onStep?: (step: string, content: string) => void,
  customSystemPrompt?: string
): Promise<DeepthinkResult> {
  const userMsg = [...messages].reverse().find((m) => m.role === 'user')
  const question = userMsg?.content || ''

  // Merge custom system prompt with deepthink prompts
  const baseContext = customSystemPrompt
    ? `${customSystemPrompt}\n\n--- DEEPTHINK INSTRUCTIONS ---\n`
    : ''

  onStep?.('thinking', '🧠 جارٍ التفكير العميق...')

  const thinkingMessages: AIMessage[] = [
    { role: 'user', content: `السؤال: ${question}` },
  ]
  const thinking = await callAI(
    providerId, modelId, thinkingMessages, apiKey, customBaseUrl,
    baseContext + THINK_PROMPT, useDirectApi
  )

  onStep?.('review', '🔍 جارٍ مراجعة التحليل...')

  const reviewMessages: AIMessage[] = [
    { role: 'user', content: `السؤال الأصلي: ${question}\n\nالتحليل:\n${thinking}` },
  ]
  const review = await callAI(
    providerId, modelId, reviewMessages, apiKey, customBaseUrl,
    baseContext + REVIEW_PROMPT, useDirectApi
  )

  onStep?.('answer', '📝 جارٍ كتابة الإجابة النهائية...')

  const finalMessages: AIMessage[] = [
    { role: 'user', content: `السؤال: ${question}\n\nالتحليل:\n${thinking}\n\nالمراجعة:\n${review}` },
  ]
  const answer = await callAI(
    providerId, modelId, finalMessages, apiKey, customBaseUrl,
    baseContext + FINAL_ANSWER_PROMPT, useDirectApi
  )

  const fullText = `## 🧠 التفكير العميق

### الخطوة 1: التحليل
${thinking}

### الخطوة 2: المراجعة
${review}

### الخطوة 3: الإجابة النهائية
${answer}`

  return { thinking, review, answer, fullText }
}

export async function* deepthinkStream(
  providerId: string,
  modelId: string,
  messages: AIMessage[],
  apiKey: string,
  customBaseUrl: string,
  useDirectApi: boolean,
  customSystemPrompt?: string
): AsyncGenerator<string> {
  const userMsg = [...messages].reverse().find((m) => m.role === 'user')
  const question = userMsg?.content || ''

  yield '## 🧠 التفكير العميق\n\n'
  yield '### الخطوة 1: التحليل\n\n'

  const thinkingSystem = customSystemPrompt || THINK_PROMPT
  const thinkingMessages: AIMessage[] = [
    { role: 'system', content: thinkingSystem },
    { role: 'user', content: `السؤال: ${question}` },
  ]

  const thinkingGen = sendChatMessage(
    providerId, modelId, thinkingMessages, apiKey, customBaseUrl, undefined, useDirectApi
  )
  const thinking = await thinkingGen
  yield thinking

  yield '\n\n### الخطوة 2: المراجعة\n\n'

  const reviewMessages: AIMessage[] = [
    { role: 'system', content: REVIEW_PROMPT },
    { role: 'user', content: `السؤال الأصلي: ${question}\n\nالتحليل:\n${thinking}` },
  ]
  const reviewGen = sendChatMessage(
    providerId, modelId, reviewMessages, apiKey, customBaseUrl, undefined, useDirectApi
  )
  const review = await reviewGen
  yield review

  yield '\n\n### الخطوة 3: الإجابة النهائية\n\n'

  const finalMessages: AIMessage[] = [
    { role: 'system', content: FINAL_ANSWER_PROMPT },
    { role: 'user', content: `السؤال: ${question}\n\nالتحليل:\n${thinking}\n\nالمراجعة:\n${review}` },
  ]
  const finalGen = sendChatMessage(
    providerId, modelId, finalMessages, apiKey, customBaseUrl, undefined, useDirectApi
  )
  const answer = await finalGen
  yield answer
}
