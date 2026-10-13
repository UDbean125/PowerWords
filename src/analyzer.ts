const POWER_WORDS: Record<string, string[]> = {
  vision: [
    'vision', 'visionary', 'mission', 'purpose', 'strategy', 'strategic',
    'roadmap', 'blueprint', 'ambition', 'aspiration', 'north star',
    'trajectory', 'horizon', 'future-proof', 'forward-looking',
  ],
  growth: [
    'growth', 'scale', 'scaling', 'expand', 'expansion', 'accelerate',
    'acceleration', 'momentum', 'velocity', 'traction', 'breakthrough',
    'outperform', 'outpace', 'hypergrowth', 'uplift', 'upside',
  ],
  innovation: [
    'innovation', 'innovate', 'innovative', 'disrupt', 'disruption',
    'disruptive', 'transform', 'transformation', 'transformative',
    'digital', 'digitization', 'automation', 'automate', 'ai',
    'artificial intelligence', 'machine learning', 'cutting-edge',
    'next-generation', 'next-gen', 'pioneering', 'frontier',
  ],
  resilience: [
    'resilience', 'resilient', 'robust', 'durable', 'durability',
    'antifragile', 'agile', 'agility', 'adaptable', 'adaptability',
    'pivot', 'weather', 'withstand', 'fortify', 'steadfast',
  ],
  sustainability: [
    'sustainability', 'sustainable', 'esg', 'carbon', 'net-zero',
    'net zero', 'climate', 'green', 'renewable', 'circular',
    'responsible', 'stewardship', 'footprint', 'impact',
    'decarbonize', 'decarbonization',
  ],
  customer: [
    'customer-centric', 'customer-first', 'client', 'user',
    'experience', 'engagement', 'satisfaction', 'loyalty', 'retention',
    'delight', 'empathy', 'personalization', 'personalize',
    'omnichannel', 'seamless',
  ],
  leadership: [
    'leadership', 'culture', 'talent', 'empower', 'empowerment',
    'inspire', 'inspiration', 'accountability', 'ownership',
    'integrity', 'transparency', 'trust', 'collaborate',
    'collaboration', 'inclusive', 'inclusion', 'diversity',
  ],
  efficiency: [
    'efficiency', 'efficient', 'optimize', 'optimization', 'streamline',
    'lean', 'operational excellence', 'execute', 'execution',
    'discipline', 'rigor', 'precision', 'productivity', 'margin',
    'cost-effective', 'synergy', 'synergies',
  ],
  value: [
    'value', 'value-creation', 'roi', 'return', 'shareholder',
    'stakeholder', 'deliver', 'outcome', 'results', 'measurable',
    'tangible', 'bottom-line', 'top-line', 'revenue', 'profitability',
  ],
  partnership: [
    'partnership', 'partner', 'ecosystem', 'alliance', 'co-create',
    'co-innovation', 'joint venture', 'network', 'platform',
    'marketplace', 'community', 'consortium',
  ],
};

const POWER_WORD_MAP = new Map<string, string>();
for (const [category, words] of Object.entries(POWER_WORDS)) {
  for (const word of words) {
    POWER_WORD_MAP.set(word.toLowerCase(), category);
  }
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'were',
  'are', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can',
  'this', 'that', 'these', 'those', 'i', 'we', 'you', 'he', 'she',
  'they', 'me', 'us', 'him', 'her', 'them', 'my', 'our', 'your', 'his',
  'its', 'their', 'what', 'which', 'who', 'whom', 'when', 'where',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'about', 'above', 'after', 'again',
  'also', 'am', 'any', 'because', 'before', 'below', 'between', 'up',
  'down', 'during', 'further', 'here', 'if', 'into', 'nor', 'off',
  'once', 'out', 'over', 'then', 'there', 'through', 'under', 'until',
  'while', 'against', 'along', 'around', 'since', 'without', 'within',
]);

export interface PowerWordResult {
  word: string;
  category: string;
  frequency: number;
  contextSnippets: string[];
}

function extractContextSnippets(text: string, word: string, maxSnippets = 3): string[] {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  const snippets: string[] = [];
  const wordLower = word.toLowerCase();

  for (const sentence of sentences) {
    if (snippets.length >= maxSnippets) break;
    if (sentence.toLowerCase().includes(wordLower)) {
      const snippet = sentence.length > 200 ? sentence.substring(0, 200) + '...' : sentence;
      snippets.push(snippet);
    }
  }
  return snippets;
}

export function analyzeText(text: string): PowerWordResult[] {
  const lowerText = text.toLowerCase();
  const wordFrequencies = new Map<string, { category: string; frequency: number; contextSnippets: string[] }>();

  for (const [word, category] of POWER_WORD_MAP) {
    if (word.includes(' ') || word.includes('-')) {
      const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches && matches.length > 0) {
        const existing = wordFrequencies.get(word);
        if (existing) {
          existing.frequency += matches.length;
        } else {
          wordFrequencies.set(word, {
            category,
            frequency: matches.length,
            contextSnippets: extractContextSnippets(text, word),
          });
        }
      }
    }
  }

  const words = lowerText.replace(/[^a-z0-9\s'-]/g, ' ').split(/\s+/);
  for (const token of words) {
    if (STOP_WORDS.has(token) || token.length < 2) continue;

    const category = POWER_WORD_MAP.get(token);
    if (category) {
      const existing = wordFrequencies.get(token);
      if (existing) {
        existing.frequency++;
      } else {
        wordFrequencies.set(token, {
          category,
          frequency: 1,
          contextSnippets: extractContextSnippets(text, token),
        });
      }
    }
  }

  const results: PowerWordResult[] = [];
  for (const [word, data] of wordFrequencies) {
    results.push({ word, ...data });
  }
  results.sort((a, b) => b.frequency - a.frequency);

  return results;
}

export function mergeResults(allResults: PowerWordResult[][]): PowerWordResult[] {
  const merged = new Map<string, PowerWordResult>();

  for (const results of allResults) {
    for (const result of results) {
      const existing = merged.get(result.word);
      if (existing) {
        existing.frequency += result.frequency;
        const snippetSet = new Set([...existing.contextSnippets, ...result.contextSnippets]);
        existing.contextSnippets = Array.from(snippetSet).slice(0, 5);
      } else {
        merged.set(result.word, { ...result });
      }
    }
  }

  const results = Array.from(merged.values());
  results.sort((a, b) => b.frequency - a.frequency);
  return results;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
