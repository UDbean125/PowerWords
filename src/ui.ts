export function renderApp(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <title>PowerWords</title>
  <style>
    :root {
      --blue: #007AFF;
      --blue-dark: #0056CC;
      --green: #34C759;
      --orange: #FF9500;
      --red: #FF3B30;
      --purple: #AF52DE;
      --teal: #5AC8FA;
      --bg: #F2F2F7;
      --card: #FFFFFF;
      --sep: rgba(60,60,67,0.12);
      --label: #000000;
      --label2: #3C3C43;
      --label3: #8E8E93;
      --radius: 12px;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--label);
      line-height: 1.4;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    .navbar {
      position: sticky; top: 0; z-index: 100;
      background: rgba(242,242,247,0.85);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border-bottom: 0.5px solid var(--sep);
      padding: 12px 16px;
      display: flex; align-items: center; justify-content: space-between;
      min-height: 56px;
    }
    .navbar-title { font-size: 17px; font-weight: 600; }
    .navbar-back { font-size: 17px; color: var(--blue); background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; }
    .navbar-action { font-size: 17px; color: var(--blue); background: none; border: none; cursor: pointer; font-weight: 500; }

    .page-header { padding: 4px 20px 12px; }
    .page-header h1 { font-size: 34px; font-weight: 700; letter-spacing: -0.5px; }
    .page-header p { font-size: 15px; color: var(--label3); margin-top: 2px; }

    .section { margin: 16px 16px; }
    .section-label {
      font-size: 13px; font-weight: 400; color: var(--label3);
      text-transform: uppercase; letter-spacing: 0.5px;
      padding: 0 16px 6px;
    }
    .section-card { background: var(--card); border-radius: var(--radius); overflow: hidden; }

    .row {
      display: flex; align-items: center; padding: 12px 16px;
      border-bottom: 0.5px solid var(--sep);
      cursor: pointer; transition: background 0.1s;
      gap: 12px; min-height: 50px;
    }
    .row:last-child { border-bottom: none; }
    .row:active { background: rgba(0,0,0,0.04); }
    .row-icon {
      width: 36px; height: 36px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    .row-content { flex: 1; min-width: 0; }
    .row-title { font-size: 17px; font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .row-sub { font-size: 13px; color: var(--label3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .row-chevron { color: var(--label3); font-size: 14px; opacity: 0.5; flex-shrink: 0; }

    .pw-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .pw-tag {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 12px; border-radius: 16px;
      font-size: 14px; font-weight: 600;
    }
    .pw-tag-1 { background: #E8F5FF; color: #0056CC; }
    .pw-tag-2 { background: #F0E8FF; color: #6B21A8; }
    .pw-tag-3 { background: #E8FFF0; color: #166534; }
    .pw-tag-4 { background: #FFF8E8; color: #92400E; }
    .pw-tag-5 { background: #FFE8E8; color: #991B1B; }
    .pw-count { font-size: 11px; opacity: 0.6; }

    .pitch-card {
      background: var(--card); border-radius: var(--radius);
      padding: 16px; margin-bottom: 12px;
    }
    .pitch-name { font-size: 17px; font-weight: 600; }
    .pitch-title { font-size: 13px; color: var(--label3); margin-bottom: 8px; }
    .pitch-quote {
      font-size: 14px; color: var(--label2); font-style: italic;
      padding: 8px 12px; background: var(--bg); border-radius: 8px;
      margin-top: 6px; line-height: 1.5;
    }

    .scan-btn {
      width: 100%; padding: 14px; border: none; border-radius: var(--radius);
      background: var(--blue); color: white;
      font-size: 17px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: opacity 0.15s;
      font-family: inherit;
    }
    .scan-btn:active { opacity: 0.7; }
    .scan-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .scan-btn.scanning { background: var(--orange); }

    .form-row {
      display: flex; align-items: center; padding: 0 16px;
      border-bottom: 0.5px solid var(--sep); min-height: 44px;
    }
    .form-row:last-child { border-bottom: none; }
    .form-row label { font-size: 17px; width: 90px; flex-shrink: 0; }
    .form-row input {
      flex: 1; border: none; outline: none; font-size: 17px;
      padding: 12px 0; background: transparent; font-family: inherit;
    }
    .form-row input::placeholder { color: var(--label3); }

    .feed-item { padding: 12px 16px; border-bottom: 0.5px solid var(--sep); }
    .feed-item:last-child { border-bottom: none; }
    .feed-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px; }
    .feed-dot.new { background: var(--green); }
    .feed-dot.old { background: var(--label3); opacity: 0.3; }
    .feed-title { font-size: 15px; font-weight: 500; }
    .feed-meta { font-size: 12px; color: var(--label3); margin-top: 2px; }
    .feed-snippet { font-size: 13px; color: var(--label2); margin-top: 4px; line-height: 1.4; }

    .empty { text-align: center; padding: 48px 24px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.3; }
    .empty-text { font-size: 17px; color: var(--label3); font-weight: 500; }
    .empty-sub { font-size: 14px; color: var(--label3); margin-top: 6px; opacity: 0.7; }

    .spinner { display: inline-block; width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .toast-wrap { position: fixed; top: 60px; left: 50%; transform: translateX(-50%); z-index: 200; }
    .toast {
      padding: 12px 20px; border-radius: 20px; color: white;
      font-size: 15px; font-weight: 500;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      animation: toastIn 0.3s ease;
      white-space: nowrap;
    }
    .toast.success { background: var(--green); }
    .toast.error { background: var(--red); }
    .toast.info { background: var(--label2); }
    @keyframes toastIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .progress-bar { height: 3px; background: var(--sep); border-radius: 2px; overflow: hidden; margin: 12px 0; }
    .progress-fill { height: 100%; background: var(--blue); transition: width 0.5s ease; border-radius: 2px; }

    .tip-box {
      background: linear-gradient(135deg, #E8F5FF, #F0E8FF);
      border-radius: var(--radius); padding: 14px 16px;
      font-size: 14px; color: var(--label2); line-height: 1.5;
    }
    .tip-box strong { color: var(--blue); }

    .hidden { display: none !important; }
    @media (min-width: 500px) {
      .section { margin: 16px auto; max-width: 500px; }
      .page-header { max-width: 500px; margin: 0 auto; }
    }
  </style>
</head>
<body>

<div id="app"></div>
<div class="toast-wrap" id="toasts"></div>

<script>
  let accounts = [];
  let selectedAccount = null;
  let executives = [];
  let powerWordsData = [];
  let currentView = 'home';

  async function api(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    document.getElementById('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function render() {
    if (currentView === 'home') renderHome();
    else if (currentView === 'account') renderAccount();
    else if (currentView === 'pitch') renderPitch();
  }

  // ─── HOME ───
  function renderHome() {
    document.getElementById('app').innerHTML = \`
      <div class="navbar">
        <span></span>
        <span class="navbar-title">PowerWords</span>
        <button class="navbar-action" onclick="showAddAccount()">+ Add</button>
      </div>
      <div class="page-header">
        <h1>Accounts</h1>
        <p>Your target companies</p>
      </div>
      <div id="addAccountSection" class="section hidden">
        <div class="section-label">New Account</div>
        <div class="section-card">
          <div class="form-row">
            <label>Company</label>
            <input id="inp-company" placeholder="e.g. Salesforce" autocomplete="off" />
          </div>
          <div class="form-row">
            <label>Industry</label>
            <input id="inp-industry" placeholder="e.g. SaaS, Healthcare" autocomplete="off" />
          </div>
        </div>
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="scan-btn" style="flex:1; background:var(--green);" onclick="createAccount()">Add Account</button>
          <button class="scan-btn" style="flex:1; background:var(--label3);" onclick="hideAddAccount()">Cancel</button>
        </div>
      </div>
      <div class="section" id="accountsSection">
        <div class="section-label">Companies</div>
        <div class="section-card" id="accountsList"></div>
      </div>
    \`;
    renderAccountsList();
  }

  function renderAccountsList() {
    const el = document.getElementById('accountsList');
    if (!el) return;
    if (accounts.length === 0) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">&#127970;</div><div class="empty-text">No accounts yet</div><div class="empty-sub">Tap + Add to get started</div></div>';
      return;
    }
    el.innerHTML = accounts.map(a => \`
      <div class="row" onclick="openAccount(\${a.id})">
        <div class="row-icon" style="background:#E8F5FF; color:var(--blue);">&#127970;</div>
        <div class="row-content">
          <div class="row-title">\${esc(a.company_name)}</div>
          <div class="row-sub">\${esc(a.industry || 'No industry set')}</div>
        </div>
        <span class="row-chevron">&#8250;</span>
      </div>
    \`).join('');
  }

  function showAddAccount() { document.getElementById('addAccountSection').classList.remove('hidden'); }
  function hideAddAccount() { document.getElementById('addAccountSection').classList.add('hidden'); }

  async function createAccount() {
    const company = document.getElementById('inp-company').value.trim();
    const industry = document.getElementById('inp-industry').value.trim();
    if (!company) return toast('Enter a company name', 'error');
    try {
      await api('POST', '/api/accounts', { company_name: company, industry });
      toast('Account added');
      await loadAccounts();
      renderHome();
    } catch (e) { toast(e.message, 'error'); }
  }

  async function loadAccounts() {
    accounts = await api('GET', '/api/accounts');
  }

  // ─── ACCOUNT ───
  async function openAccount(id) {
    selectedAccount = accounts.find(a => a.id === id);
    currentView = 'account';
    executives = await api('GET', '/api/accounts/' + id + '/executives');
    powerWordsData = await api('GET', '/api/accounts/' + id + '/power-words');
    render();
  }

  function renderAccount() {
    const a = selectedAccount;
    const hasAnalysis = powerWordsData.some(d => d.power_words.length > 0);

    document.getElementById('app').innerHTML = \`
      <div class="navbar">
        <button class="navbar-back" onclick="goHome()">&#8249; Accounts</button>
        <span class="navbar-title">\${esc(a.company_name)}</span>
        <button class="navbar-action" onclick="showAddExec()">+ Exec</button>
      </div>

      \${hasAnalysis ? \`
      <div class="section">
        <button class="scan-btn" style="background:#AF52DE;" onclick="openPitch()">
          &#9733; View Pitch Summary
        </button>
      </div>
      \` : ''}

      <div class="section">
        <button class="scan-btn" id="scanAllBtn" onclick="scanAll()">
          &#128269; Scan All Executives
        </button>
        <p style="font-size:12px; color:var(--label3); text-align:center; margin-top:6px;">
          Searches the web for annual reports, interviews, earnings calls & more
        </p>
      </div>

      <div id="addExecSection" class="section hidden">
        <div class="section-label">Add Executive</div>
        <div class="section-card">
          <div class="form-row">
            <label>Name</label>
            <input id="inp-exec-name" placeholder="e.g. Jane Smith" autocomplete="off" />
          </div>
          <div class="form-row">
            <label>Title</label>
            <input id="inp-exec-title" placeholder="e.g. CEO, CTO, VP Sales" autocomplete="off" />
          </div>
        </div>
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="scan-btn" style="flex:1; background:var(--green);" onclick="createExec()">Add</button>
          <button class="scan-btn" style="flex:1; background:var(--label3);" onclick="hideAddExec()">Cancel</button>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Leadership Team</div>
        <div class="section-card" id="execList"></div>
      </div>

      <div id="scanResults" class="section hidden">
        <div class="section-label">Live Feed</div>
        <div class="section-card" id="scanFeed"></div>
      </div>
    \`;

    renderExecList();
  }

  function renderExecList() {
    const el = document.getElementById('execList');
    if (!el) return;
    if (executives.length === 0) {
      el.innerHTML = '<div class="empty" style="padding:24px;"><div class="empty-text">No executives yet</div><div class="empty-sub">Tap + Exec to add leaders to track</div></div>';
      return;
    }

    el.innerHTML = executives.map(e => {
      const pw = powerWordsData.find(d => d.executive.id === e.id);
      const words = pw ? pw.power_words : [];
      const sourceCount = pw ? pw.source_count : 0;

      return \`
        <div class="row" style="flex-direction:column; align-items:stretch; cursor:default;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="row-icon" style="background:#F0E8FF; color:var(--purple);">&#128100;</div>
            <div class="row-content">
              <div class="row-title">\${esc(e.name)}</div>
              <div class="row-sub">\${esc(e.title)}\${sourceCount > 0 ? ' &middot; ' + sourceCount + ' sources' : ''}</div>
            </div>
            <button class="scan-btn" style="width:auto; padding:6px 14px; font-size:13px; border-radius:16px;" onclick="scanExec(\${e.id}, this)">Scan</button>
            <button style="background:none; border:none; color:var(--label3); font-size:20px; cursor:pointer; padding:4px;" onclick="deleteExec(\${e.id})">&times;</button>
          </div>
          \${words.length > 0 ? \`
            <div class="pw-tags">
              \${words.slice(0, 5).map((w, i) => \`<span class="pw-tag pw-tag-\${i+1}">\${esc(w.word)} <span class="pw-count">\${w.frequency}x</span></span>\`).join('')}
            </div>
          \` : '<div style="font-size:13px; color:var(--label3); margin-top:4px;">Not scanned yet</div>'}
        </div>
      \`;
    }).join('');
  }

  function showAddExec() { document.getElementById('addExecSection').classList.remove('hidden'); }
  function hideAddExec() { document.getElementById('addExecSection').classList.add('hidden'); }

  async function createExec() {
    const name = document.getElementById('inp-exec-name').value.trim();
    const title = document.getElementById('inp-exec-title').value.trim();
    if (!name || !title) return toast('Name and title required', 'error');
    try {
      await api('POST', '/api/executives', { account_id: selectedAccount.id, name, title });
      toast('Executive added');
      executives = await api('GET', '/api/accounts/' + selectedAccount.id + '/executives');
      hideAddExec();
      renderExecList();
    } catch (e) { toast(e.message, 'error'); }
  }

  async function deleteExec(id) {
    if (!confirm('Remove this executive?')) return;
    try {
      await api('DELETE', '/api/executives/' + id);
      executives = await api('GET', '/api/accounts/' + selectedAccount.id + '/executives');
      powerWordsData = await api('GET', '/api/accounts/' + selectedAccount.id + '/power-words');
      renderExecList();
      toast('Removed');
    } catch (e) { toast(e.message, 'error'); }
  }

  // ─── SCANNING ───
  async function scanExec(execId, btn) {
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    const feedSection = document.getElementById('scanResults');
    const feedEl = document.getElementById('scanFeed');
    feedSection.classList.remove('hidden');

    const exec = executives.find(e => e.id === execId);
    feedEl.innerHTML = \`
      <div class="feed-item">
        <span class="feed-dot new"></span>
        <span class="feed-title">Searching for \${esc(exec.name)}...</span>
        <div class="feed-meta">Scanning annual reports, interviews, earnings calls, keynotes</div>
        <div class="progress-bar"><div class="progress-fill" style="width:30%;"></div></div>
      </div>
    \` + feedEl.innerHTML;

    try {
      const result = await api('POST', '/api/scan/' + execId);

      let feedHtml = '';
      if (result.sources_saved > 0) {
        feedHtml += \`
          <div class="feed-item">
            <span class="feed-dot new"></span>
            <span class="feed-title">Found \${result.sources_discovered} results, saved \${result.sources_saved} new sources</span>
            <div class="feed-meta">\${esc(exec.name)} &middot; \${result.total_sources} total sources</div>
          </div>
        \`;
        for (const s of result.saved_sources || []) {
          feedHtml += \`
            <div class="feed-item">
              <span class="feed-dot new"></span>
              <span class="feed-title">\${esc(s.title)}</span>
              <div class="feed-meta">\${esc(s.type.replace('_', ' '))} &middot; \${s.words.toLocaleString()} words</div>
            </div>
          \`;
        }
      } else {
        feedHtml += \`
          <div class="feed-item">
            <span class="feed-dot old"></span>
            <span class="feed-title">Scan complete for \${esc(exec.name)}</span>
            <div class="feed-meta">\${result.sources_discovered} results found, \${result.total_sources} sources already saved</div>
          </div>
        \`;
      }

      if (result.top_power_words && result.top_power_words.length > 0) {
        feedHtml += \`
          <div class="feed-item">
            <span class="feed-dot new"></span>
            <span class="feed-title">Top Power Words: \${result.top_power_words.map(w => w.word).join(', ')}</span>
            <div class="feed-meta">\${esc(exec.name)}'s most used language</div>
          </div>
        \`;
      }

      feedEl.innerHTML = feedHtml + feedEl.innerHTML.replace(/<div class="feed-item">.*?Searching for.*?<\\/div>\\s*<\\/div>/s, '');

      powerWordsData = await api('GET', '/api/accounts/' + selectedAccount.id + '/power-words');
      renderExecList();
      toast('Scan complete for ' + exec.name);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }

  async function scanAll() {
    const btn = document.getElementById('scanAllBtn');
    btn.disabled = true;
    btn.className = 'scan-btn scanning';
    btn.innerHTML = '<span class="spinner"></span> Scanning all executives...';

    const feedSection = document.getElementById('scanResults');
    const feedEl = document.getElementById('scanFeed');
    feedSection.classList.remove('hidden');
    feedEl.innerHTML = \`
      <div class="feed-item">
        <span class="feed-dot new"></span>
        <span class="feed-title">Scanning all \${executives.length} executives...</span>
        <div class="feed-meta">This may take a minute. Searching public records for each leader.</div>
        <div class="progress-bar"><div class="progress-fill" style="width:15%;"></div></div>
      </div>
    \`;

    try {
      const result = await api('POST', '/api/scan-account/' + selectedAccount.id);
      let feedHtml = '';
      for (const r of result.results || []) {
        feedHtml += \`
          <div class="feed-item">
            <span class="feed-dot new"></span>
            <span class="feed-title">\${esc(r.executive)} (\${esc(r.title)})</span>
            <div class="feed-meta">\${r.sources_saved} new sources found &middot; \${r.total_sources} total</div>
            \${r.top_power_words.length > 0 ? '<div class="feed-snippet">Top words: ' + r.top_power_words.map(w => '<strong>' + esc(w.word) + '</strong>').join(', ') + '</div>' : ''}
          </div>
        \`;
      }
      feedEl.innerHTML = feedHtml;

      powerWordsData = await api('GET', '/api/accounts/' + selectedAccount.id + '/power-words');
      renderExecList();
      toast('All executives scanned!');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.className = 'scan-btn';
      btn.innerHTML = '&#128269; Scan All Executives';
    }
  }

  // ─── PITCH ───
  async function openPitch() {
    currentView = 'pitch';
    render();
  }

  async function renderPitch() {
    let data;
    try {
      data = await api('GET', '/api/accounts/' + selectedAccount.id + '/pitch-summary');
    } catch (e) {
      toast(e.message, 'error');
      return;
    }

    document.getElementById('app').innerHTML = \`
      <div class="navbar">
        <button class="navbar-back" onclick="openAccount(\${selectedAccount.id})">&#8249; \${esc(selectedAccount.company_name)}</button>
        <span class="navbar-title">Pitch Summary</span>
        <span></span>
      </div>
      <div class="page-header">
        <h1>\${esc(data.company)}</h1>
        <p>Use these words in your conversations with \${esc(data.company)} leadership</p>
      </div>
      <div class="section">
        \${data.executives.filter(e => e.topWords.length > 0).map(e => \`
          <div class="pitch-card">
            <div class="pitch-name">\${esc(e.name)}</div>
            <div class="pitch-title">\${esc(e.title)}</div>
            <div class="pw-tags">
              \${e.topWords.map((w, i) => \`<span class="pw-tag pw-tag-\${i+1}">\${esc(w.word)} <span class="pw-count">\${w.frequency}x</span></span>\`).join('')}
            </div>
            \${e.topWords.filter(w => w.example).slice(0, 2).map(w => \`
              <div class="pitch-quote">"...\${esc(w.example)}..."</div>
            \`).join('')}
          </div>
        \`).join('')}
      </div>
      <div class="section">
        <div class="tip-box">
          <strong>Pitch Tip:</strong> Mirror these power words in your proposals and emails to \${esc(data.company)}.
          When leaders hear their own language reflected back, it builds instant rapport and shows alignment with their priorities.
        </div>
      </div>
    \`;
  }

  function goHome() {
    currentView = 'home';
    selectedAccount = null;
    render();
  }

  // ─── Init ───
  (async () => {
    try {
      await loadAccounts();
    } catch (e) {
      console.error('Failed to load accounts:', e);
      accounts = [];
    }
    render();
  })();
</script>
</body>
</html>`;
}
