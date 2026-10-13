import { matchRoute } from './router';
import { renderApp } from './ui';

let dbInitialized = false;

async function ensureDb(env: Env) {
	if (dbInitialized) return;
	try {
		await env.DB.batch([
			env.DB.prepare(`CREATE TABLE IF NOT EXISTS accounts (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				company_name TEXT NOT NULL,
				industry TEXT,
				created_at TEXT NOT NULL DEFAULT (datetime('now'))
			)`),
			env.DB.prepare(`CREATE TABLE IF NOT EXISTS executives (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				account_id INTEGER NOT NULL,
				name TEXT NOT NULL,
				title TEXT NOT NULL,
				created_at TEXT NOT NULL DEFAULT (datetime('now')),
				FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
			)`),
			env.DB.prepare(`CREATE TABLE IF NOT EXISTS sources (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				executive_id INTEGER NOT NULL,
				source_type TEXT NOT NULL,
				title TEXT NOT NULL,
				content TEXT NOT NULL,
				source_url TEXT,
				source_date TEXT,
				created_at TEXT NOT NULL DEFAULT (datetime('now')),
				FOREIGN KEY (executive_id) REFERENCES executives(id) ON DELETE CASCADE
			)`),
			env.DB.prepare(`CREATE TABLE IF NOT EXISTS power_words (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				executive_id INTEGER NOT NULL,
				word TEXT NOT NULL,
				frequency INTEGER NOT NULL DEFAULT 1,
				context_snippets TEXT,
				analyzed_at TEXT NOT NULL DEFAULT (datetime('now')),
				FOREIGN KEY (executive_id) REFERENCES executives(id) ON DELETE CASCADE
			)`),
			env.DB.prepare(`CREATE TABLE IF NOT EXISTS settings (
				key TEXT PRIMARY KEY NOT NULL,
				value TEXT NOT NULL
			)`),
		]);
		dbInitialized = true;
	} catch {
		dbInitialized = true;
	}
}

export default {
	async fetch(request, env) {
		await ensureDb(env);

		const url = new URL(request.url);
		const { pathname } = url;

		if (pathname.startsWith('/api/')) {
			const matched = matchRoute(request.method, pathname);
			if (matched) {
				try {
					return await matched.handler(request, env, matched.params);
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : 'Internal server error';
					return new Response(JSON.stringify({ error: message }), {
						status: 500,
						headers: { 'content-type': 'application/json' },
					});
				}
			}
			return new Response(JSON.stringify({ error: 'Not found' }), {
				status: 404,
				headers: { 'content-type': 'application/json' },
			});
		}

		return new Response(renderApp(), {
			headers: { 'content-type': 'text/html' },
		});
	},
} satisfies ExportedHandler<Env>;
