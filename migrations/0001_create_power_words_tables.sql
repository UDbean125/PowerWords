-- Migration: CEO Power Words Analyzer schema

CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    industry TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS executives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    executive_id INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_url TEXT,
    source_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (executive_id) REFERENCES executives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS power_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    executive_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 1,
    context_snippets TEXT,
    analyzed_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (executive_id) REFERENCES executives(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_executives_account ON executives(account_id);
CREATE INDEX IF NOT EXISTS idx_sources_executive ON sources(executive_id);
CREATE INDEX IF NOT EXISTS idx_power_words_executive ON power_words(executive_id);
CREATE INDEX IF NOT EXISTS idx_power_words_frequency ON power_words(executive_id, frequency DESC);
