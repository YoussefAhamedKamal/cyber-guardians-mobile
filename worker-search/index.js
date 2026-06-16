export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    if (url.pathname === '/search') {
      return handleSearch(request, corsHeaders)
    }

    if (url.pathname === '/search/html') {
      return handleSearchHTML(request, corsHeaders)
    }

    return new Response(JSON.stringify({ 
      error: 'Not found',
      usage: {
        '/search?q=query': 'Search using DuckDuckGo API',
        '/search/html?q=query': 'Search using DuckDuckGo HTML (more results)',
      }
    }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
}

async function handleSearch(request, corsHeaders) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query parameter ?q=' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const encoded = encodeURIComponent(query)
    const res = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`)
    
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Search failed', status: res.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    const results = []

    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText.slice(0, 500),
        url: data.AbstractURL,
        source: 'duckduckgo',
      })
    }

    if (data.Answer) {
      results.unshift({
        title: data.Heading || 'Answer',
        snippet: data.Answer,
        url: data.AnswerURL,
        source: 'duckduckgo',
      })
    }

    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text) {
          results.push({
            title: topic.Text.slice(0, 100),
            snippet: topic.Text.slice(0, 500),
            url: topic.FirstURL,
            source: 'duckduckgo',
          })
        }
      }
    }

    return new Response(JSON.stringify({
      query,
      results: results.slice(0, 8),
      total: results.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Search error', message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

async function handleSearchHTML(request, corsHeaders) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query parameter ?q=' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const encoded = encodeURIComponent(query)
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'HTML search failed', status: res.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const html = await res.text()
    const results = []

    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g

    let match
    const urls = []
    const titles = []
    const snippets = []

    while ((match = resultRegex.exec(html)) !== null) {
      urls.push(match[1])
      titles.push(match[2].replace(/<[^>]*>/g, '').trim())
    }

    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(match[1].replace(/<[^>]*>/g, '').trim())
    }

    for (let i = 0; i < Math.min(urls.length, 8); i++) {
      results.push({
        title: titles[i] || '',
        snippet: (snippets[i] || '').slice(0, 500),
        url: urls[i] || '',
        source: 'duckduckgo-html',
      })
    }

    return new Response(JSON.stringify({
      query,
      results,
      total: results.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'HTML search error', message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
