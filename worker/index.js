export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim())
    const corsHeaders = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Token, HTTP-Referer, X-Title',
      'Access-Control-Max-Age': '86400',
    }
    if (allowed.includes(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const url = new URL(request.url)
    if (url.pathname === '/health') {
      return new Response('ok', { headers: { ...corsHeaders, 'Content-Type': 'text/plain' } })
    }

    // Web scraping endpoint
    if (url.pathname === '/scrape') {
      const scrapeUrl = url.searchParams.get('url')
      if (!scrapeUrl) {
        return new Response(JSON.stringify({ error: 'Missing ?url= parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      try {
        const resp = await fetch(scrapeUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CyberGuardiansBot/1.0)' },
          signal: AbortSignal.timeout(15000),
        })
        if (!resp.ok) {
          return new Response(JSON.stringify({ error: `HTTP ${resp.status}` }), {
            status: resp.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const html = await resp.text()
        return new Response(JSON.stringify({ html, url: scrapeUrl }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const authToken = env.AUTH_TOKEN
    if (authToken) {
      const provided = request.headers.get('X-Auth-Token')
      if (provided !== authToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const target = url.searchParams.get('target')
    if (!target) {
      return new Response(JSON.stringify({ error: 'Missing ?target= parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let targetUrl
    try {
      targetUrl = new URL(target)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid target URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const allowedHosts = [
      'api.openai.com',
      'generativelanguage.googleapis.com',  // Gemini
      'api.anthropic.com',
      'openrouter.ai',
      'integrate.api.nvidia.com',          // NVIDIA
      'api.groq.com',                      // Groq
      'api-inference.huggingface.co',      // HuggingFace
      'api.mistral.ai',                    // Mistral
      'api.cerebras.ai',                   // Cerebras
      'api.cohere.ai',                     // Cohere
      'models.inference.ai.azure.com',     // GitHub Models
      'api.cloudflare.com',                // Cloudflare Workers AI
      'api.vercel.ai',                     // Vercel AI Gateway
      'api.opencodezen.com',               // OpenCode Zen
    ]
    if (!allowedHosts.includes(targetUrl.hostname)) {
      return new Response(JSON.stringify({ error: 'Host not allowed: ' + targetUrl.hostname }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build headers for upstream request
    const headers = new Headers()
    // Copy important headers from original request
    const contentType = request.headers.get('Content-Type')
    if (contentType) headers.set('Content-Type', contentType)
    const authorization = request.headers.get('Authorization')
    if (authorization) headers.set('Authorization', authorization)
    const httpReferer = request.headers.get('HTTP-Referer')
    if (httpReferer) headers.set('HTTP-Referer', httpReferer)
    const xTitle = request.headers.get('X-Title')
    if (xTitle) headers.set('X-Title', xTitle)

    const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined

    // Debug: Log request details
    console.log('Worker Debug:', {
      target: targetUrl.toString(),
      method: request.method,
      hasBody: !!body,
      bodySize: body ? body.byteLength : 0,
      contentType: headers.get('Content-Type'),
      hasAuth: !!headers.get('Authorization'),
    })

    try {
      const resp = await fetch(targetUrl.toString(), {
        method: request.method,
        headers,
        body,
      })

      const contentType = resp.headers.get('content-type') || ''
      const isStreaming = contentType.includes('text/event-stream') || contentType.includes('text/plain')

      // For streaming responses (SSE), pass through directly without buffering
      if (isStreaming) {
        const respHeaders = new Headers(resp.headers)
        Object.entries(corsHeaders).forEach(([k, v]) => respHeaders.set(k, v))
        respHeaders.delete('Content-Security-Policy')
        respHeaders.set('Content-Type', contentType)

        return new Response(resp.body, {
          status: resp.status,
          statusText: resp.statusText,
          headers: respHeaders,
        })
      }

      // For JSON responses, buffer and validate
      const respText = await resp.text()
      let isJson = false
      try {
        JSON.parse(respText)
        isJson = true
      } catch {}

      const respHeaders = new Headers(resp.headers)
      Object.entries(corsHeaders).forEach(([k, v]) => respHeaders.set(k, v))
      respHeaders.delete('Content-Security-Policy')

      if (isJson) {
        respHeaders.set('Content-Type', 'application/json')
        return new Response(respText, {
          status: resp.status,
          statusText: resp.statusText,
          headers: respHeaders,
        })
      } else {
        return new Response(JSON.stringify({
          error: 'Upstream returned non-JSON response',
          status: resp.status,
          contentType: contentType,
          preview: respText.slice(0, 500)
        }), {
          status: resp.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } catch (err) {
      return new Response(JSON.stringify({
        error: 'Failed to fetch upstream',
        message: err.message,
        target: targetUrl.hostname
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  },
}
