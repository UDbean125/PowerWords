import { analyzeText, mergeResults } from './analyzer';

type Env = { DB: D1Database };

interface RouteHandler {
  (request: Request, env: Env, params: Record<string, string>): Promise<Response>;
}

const routes: { method: string; pattern: RegExp; handler: RouteHandler }[] = [];

function route(method: string, path: string, handler: RouteHandler) {
  const pattern = new RegExp(
    '^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'
  );
  routes.push({ method, pattern, handler });
}

export function matchRoute(method: string, pathname: string): { handler: RouteHandler; params: Record<string, string> } | null {
  for (const r of routes) {
    if (r.method !== method) continue;
    const match = pathname.match(r.pattern);
    if (match) {
      return { handler: r.handler, params: match.groups ?? {} };
    }
  }
  return null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

// ─── Accounts ───────────────────────────────────────────────────────

route('GET', '/api/accounts', async (_req, env) => {
  const { results } = await env.DB.prepare(
    'SELECT * FROM accounts ORDER BY created_at DESC'
  ).all();
  return json(results);
});

route('POST', '/api/accounts', async (req, env) => {
  const body = await req.json() as { company_name?: string; industry?: string };
  if (!body.company_name) return error('company_name is required');

  const result = await env.DB.prepare(
    'INSERT INTO accounts (company_name, industry) VALUES (?, ?) RETURNING *'
  ).bind(body.company_name, body.industry ?? null).first();
  return json(result, 201);
});

route('DELETE', '/api/accounts/:id', async (_req, env, params) => {
  await env.DB.prepare('DELETE FROM accounts WHERE id = ?').bind(params.id).run();
  return json({ success: true });
});

// ─── Executives ─────────────────────────────────────────────────────

route('GET', '/api/accounts/:id/executives', async (_req, env, params) => {
  const { results } = await env.DB.prepare(
    'SELECT * FROM executives WHERE account_id = ? ORDER BY created_at DESC'
  ).bind(params.id).all();
  return json(results);
});

route('POST', '/api/executives', async (req, env) => {
  const body = await req.json() as { account_id?: number; name?: string; title?: string };
  if (!body.account_id || !body.name || !body.title) {
    return error('account_id, name, and title are required');
  }

  const result = await env.DB.prepare(
    'INSERT INTO executives (account_id, name, title) VALUES (?, ?, ?) RETURNING *'
  ).bind(body.account_id, body.name, body.title).first();
  return json(result, 201);
});

route('DELETE', '/api/executives/:id', async (_req, env, params) => {
  await env.DB.prepare('DELETE FROM executives WHERE id = ?').bind(params.id).run();
  return json({ success: true });
});

// ─── Sources ────────────────────────────────────────────────────────

route('GET', '/api/executives/:id/sources', async (_req, env, params) => {
  const { results } = await env.DB.prepare(
    'SELECT id, executive_id, source_type, title, source_url, source_date, created_at FROM sources WHERE executive_id = ? ORDER BY created_at DESC'
  ).bind(params.id).all();
  return json(results);
});

route('POST', '/api/sources', async (req, env) => {
  const body = await req.json() as {
    executive_id?: number;
    source_type?: string;
    title?: string;
    content?: string;
    source_url?: string;
    source_date?: string;
  };
  if (!body.executive_id || !body.source_type || !body.title || !body.content) {
    return error('executive_id, source_type, title, and content are required');
  }

  const result = await env.DB.prepare(
    'INSERT INTO sources (executive_id, source_type, title, content, source_url, source_date) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
  ).bind(
    body.executive_id,
    body.source_type,
    body.title,
    body.content,
    body.source_url ?? null,
    body.source_date ?? null
  ).first();
  return json(result, 201);
});

route('DELETE', '/api/sources/:id', async (_req, env, params) => {
  await env.DB.prepare('DELETE FROM sources WHERE id = ?').bind(params.id).run();
  return json({ success: true });
});

// ─── Settings ───────────────────────────────────────────────────────

route('GET', '/api/settings', async (_req, env) => {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
  const settings: Record<string, string> = {};
  for (const row of results ?? []) {
    settings[row.key] = row.key.includes('api_key') ? '••••' + row.value.slice(-4) : row.value;
  }
  return json(settings);
});

route('POST', '/api/settings', async (req, env) => {
  const body = await req.json() as Record<string, string>;
  const allowed = ['google_api_key', 'google_cx'];
  const stmts = [];
  for (const [key, value] of Object.entries(body)) {
    if (!allowed.includes(key)) continue;
    stmts.push(
      env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?')
        .bind(key, value, value)
    );
  }
  if (stmts.length > 0) await env.DB.batch(stmts);
  return json({ success: true });
});

route('GET', '/api/settings/status', async (_req, env) => {
  const apiKey = await env.DB.prepare("SELECT value FROM settings WHERE key = 'google_api_key'").first<{ value: string }>();
  const cx = await env.DB.prepare("SELECT value FROM settings WHERE key = 'google_cx'").first<{ value: string }>();
  return json({ configured: !!(apiKey?.value && cx?.value) });
});

// ─── Automated Web Search & Scan ────────────────────────────────────

async function googleSearch(query: string, env: Env): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const apiKey = await env.DB.prepare("SELECT value FROM settings WHERE key = 'google_api_key'").first<{ value: string }>();
  const cx = await env.DB.prepare("SELECT value FROM settings WHERE key = 'google_cx'").first<{ value: string }>();

  if (!apiKey?.value || !cx?.value) return [];

  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey.value)}&cx=${encodeURIComponent(cx.value)}&q=${encodeURIComponent(query)}&num=5`;
  const resp = await fetch(url);
  if (!resp.ok) return [];

  const data = await resp.json() as { items?: Array<{ title: string; link: string; snippet: string }> };
  return (data.items ?? []).map(item => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet || '',
  }));
}

route('POST', '/api/scan/:executiveId', async (_req, env, params) => {
  const executiveId = params.executiveId;

  const exec = await env.DB.prepare(
    'SELECT e.*, a.company_name FROM executives e JOIN accounts a ON e.account_id = a.id WHERE e.id = ?'
  ).bind(executiveId).first<{ id: number; name: string; title: string; company_name: string }>();

  if (!exec) return error('Executive not found', 404);

  // Check if Google API is configured
  const apiStatus = await env.DB.prepare("SELECT value FROM settings WHERE key = 'google_api_key'").first<{ value: string }>();
  if (!apiStatus?.value) {
    return error('Google Custom Search API not configured. Go to Settings to add your API key and Search Engine ID.');
  }

  const queries = [
    `"${exec.name}" ${exec.company_name} annual report letter shareholders`,
    `"${exec.name}" ${exec.company_name} interview transcript`,
    `"${exec.name}" ${exec.company_name} earnings call transcript`,
    `"${exec.name}" ${exec.company_name} keynote speech conference`,
    `"${exec.name}" ${exec.company_name} ${exec.title} strategy vision`,
  ];

  const discoveredSources: Array<{ title: string; url: string; snippet: string; source_type: string }> = [];

  for (const query of queries) {
    try {
      const results = await googleSearch(query, env);
      for (const r of results) {
        let source_type = 'other';
        const lowerTitle = (r.title + ' ' + r.snippet).toLowerCase();
        if (lowerTitle.includes('annual report') || lowerTitle.includes('shareholder')) source_type = 'annual_report';
        else if (lowerTitle.includes('interview') || lowerTitle.includes('q&a')) source_type = 'interview';
        else if (lowerTitle.includes('earnings') || lowerTitle.includes('quarterly')) source_type = 'earnings_call';
        else if (lowerTitle.includes('keynote') || lowerTitle.includes('speech') || lowerTitle.includes('conference')) source_type = 'keynote';
        else if (lowerTitle.includes('blog') || lowerTitle.includes('post')) source_type = 'blog_post';
        else if (lowerTitle.includes('press release') || lowerTitle.includes('announcement')) source_type = 'press_release';

        discoveredSources.push({ ...r, source_type });
      }
    } catch {
      // Search failed for this query, continue
    }
  }

  const seen = new Set<string>();
  const unique = discoveredSources.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  let saved = 0;
  const savedSources: Array<{ title: string; type: string; url: string; words: number }> = [];

  for (const source of unique.slice(0, 10)) {
    const existing = await env.DB.prepare(
      'SELECT id FROM sources WHERE executive_id = ? AND source_url = ?'
    ).bind(executiveId, source.url).first();
    if (existing) continue;

    try {
      const pageResp = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PowerWordsBot/1.0)',
          'Accept': 'text/html',
        },
        redirect: 'follow',
      });

      if (!pageResp.ok) continue;
      const contentType = pageResp.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) continue;

      const pageHtml = await pageResp.text();
      const pageText = extractArticleText(pageHtml);

      if (pageText.length < 100) {
        if (source.snippet.length > 50) {
          await env.DB.prepare(
            'INSERT INTO sources (executive_id, source_type, title, content, source_url) VALUES (?, ?, ?, ?, ?)'
          ).bind(executiveId, source.source_type, source.title, source.snippet, source.url).run();
          saved++;
          savedSources.push({ title: source.title, type: source.source_type, url: source.url, words: source.snippet.split(/\s+/).length });
        }
        continue;
      }

      await env.DB.prepare(
        'INSERT INTO sources (executive_id, source_type, title, content, source_url) VALUES (?, ?, ?, ?, ?)'
      ).bind(executiveId, source.source_type, source.title, pageText.substring(0, 50000), source.url).run();
      saved++;
      savedSources.push({ title: source.title, type: source.source_type, url: source.url, words: pageText.split(/\s+/).length });
    } catch {
      // Failed to fetch page
    }
  }

  const { results: allSources } = await env.DB.prepare(
    'SELECT content FROM sources WHERE executive_id = ?'
  ).bind(executiveId).all<{ content: string }>();

  let topPowerWords: Array<{ word: string; category: string; frequency: number; contextSnippets: string[] }> = [];
  if (allSources && allSources.length > 0) {
    const allResults = allSources.map(s => analyzeText(s.content));
    const merged = mergeResults(allResults);

    await env.DB.prepare('DELETE FROM power_words WHERE executive_id = ?').bind(executiveId).run();

    const topWords = merged.slice(0, 20);
    const stmts = topWords.map(pw =>
      env.DB.prepare(
        'INSERT INTO power_words (executive_id, word, frequency, context_snippets) VALUES (?, ?, ?, ?)'
      ).bind(executiveId, pw.word, pw.frequency, JSON.stringify(pw.contextSnippets))
    );

    if (stmts.length > 0) {
      await env.DB.batch(stmts);
    }
    topPowerWords = topWords;
  }

  return json({
    executive: exec.name,
    title: exec.title,
    company: exec.company_name,
    sources_discovered: unique.length,
    sources_saved: saved,
    saved_sources: savedSources,
    total_sources: allSources?.length ?? 0,
    top_power_words: topPowerWords.slice(0, 5),
  });
});

// ─── Scan All Executives for an Account ─────────────────────────────

route('POST', '/api/scan-account/:accountId', async (req, env, params) => {
  const { results: executives } = await env.DB.prepare(
    'SELECT id FROM executives WHERE account_id = ?'
  ).bind(params.accountId).all<{ id: number }>();

  if (!executives || executives.length === 0) {
    return error('No executives found for this account');
  }

  const scanResults = [];
  for (const exec of executives) {
    const fakeReq = new Request(req.url, { method: 'POST' });
    const matched = matchRoute('POST', '/api/scan/' + exec.id);
    if (matched) {
      const resp = await matched.handler(fakeReq, env, { executiveId: String(exec.id) });
      const data = await resp.json();
      scanResults.push(data);
    }
  }

  return json({ results: scanResults });
});

// ─── Manual Analysis ────────────────────────────────────────────────

route('POST', '/api/analyze/:executiveId', async (_req, env, params) => {
  const executiveId = params.executiveId;

  const { results: sources } = await env.DB.prepare(
    'SELECT content FROM sources WHERE executive_id = ?'
  ).bind(executiveId).all<{ content: string }>();

  if (!sources || sources.length === 0) {
    return error('No sources found for this executive.');
  }

  const allResults = sources.map(s => analyzeText(s.content));
  const merged = mergeResults(allResults);

  await env.DB.prepare('DELETE FROM power_words WHERE executive_id = ?').bind(executiveId).run();

  const topWords = merged.slice(0, 20);
  const stmts = topWords.map(pw =>
    env.DB.prepare(
      'INSERT INTO power_words (executive_id, word, frequency, context_snippets) VALUES (?, ?, ?, ?)'
    ).bind(executiveId, pw.word, pw.frequency, JSON.stringify(pw.contextSnippets))
  );

  if (stmts.length > 0) {
    await env.DB.batch(stmts);
  }

  return json({
    executive_id: Number(executiveId),
    sources_analyzed: sources.length,
    top_power_words: topWords,
  });
});

// ─── Power Words Results ────────────────────────────────────────────

route('GET', '/api/accounts/:id/power-words', async (_req, env, params) => {
  const { results: executives } = await env.DB.prepare(
    'SELECT * FROM executives WHERE account_id = ? ORDER BY name'
  ).bind(params.id).all<{ id: number; name: string; title: string }>();

  if (!executives || executives.length === 0) return json([]);

  const executiveResults = [];
  for (const exec of executives) {
    const { results: words } = await env.DB.prepare(
      'SELECT word, frequency, context_snippets FROM power_words WHERE executive_id = ? ORDER BY frequency DESC LIMIT 5'
    ).bind(exec.id).all<{ word: string; frequency: number; context_snippets: string }>();

    const { results: sources } = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM sources WHERE executive_id = ?'
    ).bind(exec.id).all<{ count: number }>();

    executiveResults.push({
      executive: { id: exec.id, name: exec.name, title: exec.title },
      source_count: sources?.[0]?.count ?? 0,
      power_words: (words ?? []).map(w => ({
        word: w.word,
        frequency: w.frequency,
        context_snippets: JSON.parse(w.context_snippets || '[]'),
      })),
    });
  }

  return json(executiveResults);
});

// ─── Pitch Summary ─────────────────────────────────────────────────

route('GET', '/api/accounts/:id/pitch-summary', async (_req, env, params) => {
  const account = await env.DB.prepare(
    'SELECT * FROM accounts WHERE id = ?'
  ).bind(params.id).first<{ id: number; company_name: string; industry: string }>();

  if (!account) return error('Account not found', 404);

  const { results: executives } = await env.DB.prepare(
    'SELECT * FROM executives WHERE account_id = ? ORDER BY name'
  ).bind(params.id).all<{ id: number; name: string; title: string }>();

  const pitchData = [];
  for (const exec of executives ?? []) {
    const { results: words } = await env.DB.prepare(
      'SELECT word, frequency, context_snippets FROM power_words WHERE executive_id = ? ORDER BY frequency DESC LIMIT 5'
    ).bind(exec.id).all<{ word: string; frequency: number; context_snippets: string }>();

    pitchData.push({
      name: exec.name,
      title: exec.title,
      topWords: (words ?? []).map(w => ({
        word: w.word,
        frequency: w.frequency,
        example: JSON.parse(w.context_snippets || '[]')[0] ?? '',
      })),
    });
  }

  return json({
    company: account.company_name,
    industry: account.industry,
    executives: pitchData,
  });
});

// ─── HTML Parsing Helpers ───────────────────────────────────────────

function extractArticleText(html: string): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const articleMatch = cleaned.match(/<article[\s\S]*?<\/article>/i)
    || cleaned.match(/<main[\s\S]*?<\/main>/i)
    || cleaned.match(/<div[^>]*class="[^"]*(?:content|article|post|body|text)[^"]*"[\s\S]*?<\/div>/i);

  const contentHtml = articleMatch ? articleMatch[0] : cleaned;

  const paragraphs: string[] = [];
  const pRegex = /<(?:p|h[1-6]|li|blockquote|td)[^>]*>([\s\S]*?)<\/(?:p|h[1-6]|li|blockquote|td)>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(contentHtml)) !== null) {
    const text = pMatch[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length > 20) {
      paragraphs.push(text);
    }
  }

  return paragraphs.join('\n\n');
}
