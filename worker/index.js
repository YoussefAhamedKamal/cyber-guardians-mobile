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

    const allowedHosts = ['api.openai.com', 'generativelanguage.googleapis.com', 'api.anthropic.com', 'openrouter.ai']
    if (!allowedHosts.includes(targetUrl.hostname)) {
      return new Response(JSON.stringify({ error: 'Host not allowed: ' + targetUrl.hostname }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const headers = new Headers(request.headers)
    headers.delete('Origin')
    headers.delete('Referer')
    headers.delete('X-Auth-Token')
    headers.set('Host', targetUrl.host)

    const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined

    const resp = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body,
    })

    const respHeaders = new Headers(resp.headers)
    Object.entries(corsHeaders).forEach(([k, v]) => respHeaders.set(k, v))
    respHeaders.delete('Content-Security-Policy')

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    })
  },
}
