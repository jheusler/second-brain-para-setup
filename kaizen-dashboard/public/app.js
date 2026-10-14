const $ = (s) => document.querySelector(s);
const app = $('#app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const state = { tab: 'today', today: null, insights: null, projects: null, open: {} };

const WHY = {
  brain: 'Get everything out of your head first. Messy is fine, even one bullet resets your brain.',
  hl: 'The ONE thing that would make today feel like real progress. Aim for 60-90 minutes or less.',
  mc: 'A tiny 2-minute action toward your bigger goal. Pick fresh each day to match your energy.',
};

async function api(path, method = 'GET', body) {
  const r = await fetch(`/api/${path}`, {
    method,
    headers: method === 'GET' ? {} : { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== 'login') { state.authed = false; render(); throw new Error('Signed out'); }
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// Run a write, then refresh from the server. Failures show a toast and resync.
async function act(fn) {
  try { await fn(); } catch (e) { toast(e.message); }
  await load(state.tab, true);
}

async function load(tab, quiet) {
  try {
    if (tab === 'today') state.today = await api('today');
    if (tab === 'insights') state.insights = await api('insights');
    if (tab === 'projects') state.projects = await api('projects');
  } catch (e) {
    if (!quiet) toast(e.message);
  }
  render();
}

// ---- views ---------------------------------------------------------------

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};
const prettyDate = (ymd) =>
  new Date(`${ymd}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const prio = (p) => (p?.includes('Must') ? 'must' : p?.includes('Should') ? 'should' : p?.includes('Could') ? 'could' : '');

const info = (k) => `<button class="info" data-act="why" data-k="${k}" aria-label="How this works" aria-expanded="${Boolean(state.open[k])}">?</button>`;
const why = (k) => (state.open[k] ? `<p class="why">${WHY[k]}</p>` : '');

function dailyBlock(kind, cls, emoji, title, prompt, row, placeholder) {
  return `<section class="card ${cls}">
    <header><span class="emoji">${emoji}</span><h2>${title}</h2>${info(cls)}</header>
    ${why(cls)}
    ${row
      ? `<div class="big ${cls}"><button class="chk ${row.done ? 'on' : ''}" data-act="toggle-daily" data-kind="${kind}" data-id="${row.id}" data-done="${!row.done}" aria-label="Mark ${title} ${row.done ? 'not done' : 'done'}">✓</button>
         <div class="t">${esc(row.name)}</div><button class="icon" data-act="edit-daily" data-kind="${kind}" aria-label="Change ${title}">✎</button></div>`
      : `<p class="prompt">${prompt}</p>`}
    <form class="row" data-form="daily" data-kind="${kind}" ${row && !state.editing?.[kind] ? 'hidden' : ''} style="margin-top:10px">
      <input type="text" name="name" maxlength="200" placeholder="${placeholder}" value="${state.editing?.[kind] ? esc(row.name) : ''}" autocomplete="off" required>
      <button class="btn">${row ? 'Save' : 'Set'}</button>
    </form>
  </section>`;
}

function viewToday() {
  const t = state.today;
  if (!t) return '<p class="muted">Loading…</p>';
  const steps = [t.brainDump.length > 0, Boolean(t.highlight), Boolean(t.micro), Boolean(t.highlight?.done), Boolean(t.micro?.done)];
  const n = steps.filter(Boolean).length;

  const brain = `<section class="card brain">
    <header><span class="emoji">🧠</span><h2>Brain Dump</h2>${info('brain')}</header>${why('brain')}
    <p class="prompt">Don't organize. Just dump everything on your mind.</p>
    <form class="row" data-form="brain"><input type="text" name="text" maxlength="500" placeholder="What's on your mind?" autocomplete="off" required><button class="btn">Add</button></form>
    ${t.brainDump.length ? `<ul>${t.brainDump.map((b) => `<li><span class="t">${esc(b.text)}</span>
      <button class="icon" data-act="to-highlight" data-text="${esc(b.text)}" title="Make it my Daily Highlight" aria-label="Make Daily Highlight">⭐</button>
      <button class="icon" data-act="to-task" data-text="${esc(b.text)}" title="Add as a to-do" aria-label="Add as to-do">✅</button>
      <button class="icon" data-act="del-brain" data-id="${b.id}" aria-label="Delete">✕</button></li>`).join('')}</ul>` : ''}
    ${t.logUrl ? `<p class="muted" style="margin-top:10px"><a href="${esc(t.logUrl)}" target="_blank" rel="noopener">Open today's log in Notion ↗</a></p>` : ''}
  </section>`;

  const taskRow = (x, od) => `<li class="${x.done ? 'done' : ''}">
    <button class="chk ${x.done ? 'on' : ''}" data-act="toggle-task" data-id="${x.id}" data-done="${!x.done}" aria-label="Toggle ${esc(x.name)}">✓</button>
    <span class="t">${esc(x.name)}</span>
    ${x.priority ? `<span class="chip ${prio(x.priority)}">${esc(x.priority.replace(/^\S+\s/, ''))}</span>` : ''}
    ${x.est ? `<span class="chip">${x.est}m</span>` : ''}
    ${od ? `<button class="btn small ghost" data-act="move-today" data-id="${x.id}">Today</button><button class="btn small ghost" data-act="skip" data-id="${x.id}">Skip</button>` : ''}</li>`;

  const todos = `<section class="card todo">
    <header><span class="emoji">✅</span><h2>To-do's for the day</h2></header>
    <p class="prompt">Everything that isn't your Daily Highlight.</p>
    ${t.tasks.length ? `<ul>${t.tasks.map((x) => taskRow(x)).join('')}</ul>` : '<p class="empty">Nothing yet. Add a task below.</p>'}
    <form class="quick" data-form="task">
      <input class="full" type="text" name="name" maxlength="200" placeholder="Add a to-do" autocomplete="off" required>
      <select name="priority" aria-label="Priority"><option value="">Priority</option><option>🎯 Must Do</option><option>🗓️ Should Do</option><option>💭 Could Do</option></select>
      <input type="number" name="est" min="1" max="600" inputmode="numeric" placeholder="min" aria-label="Estimated minutes">
      <button class="btn">Add</button>
    </form>
  </section>`;

  const overdue = t.overdue.length ? `<section class="card overdue">
    <header><span class="emoji">⏰</span><h2>Carry-forward (${t.overdue.length})</h2></header>
    <p class="prompt">Unfinished from earlier days. Move to today or skip. No guilt.</p>
    <ul>${t.overdue.map((x) => taskRow(x, true)).join('')}</ul></section>` : '';

  return `<div class="top"><div><p class="muted">${greeting()}, Jessica</p><h1>${prettyDate(t.date)}</h1></div>
    <div class="ring" style="--p:${n * 20}" role="img" aria-label="${n} of 5 steps done"><b>${n}/5</b></div></div>
    ${brain}
    ${dailyBlock('highlight', 'hl', '⭐', 'Daily Highlight', 'Look at your brain dump. What ONE thing would make today a win?', t.highlight, 'My one thing today')}
    ${dailyBlock('micro', 'mc', '🎯', 'Micro-Commitment', 'What is one tiny 2-minute action toward your bigger goal?', t.micro, 'My 2-minute action')}
    ${todos}${overdue}
    <button class="logout" data-act="logout">Sign out</button>`;
}

function viewInsights() {
  const s = state.insights;
  if (!s) return '<p class="muted">Loading…</p>';
  const max = Math.max(1, ...s.weeks.map((w) => w.total));
  const label = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
  const ratioNote = s.estimateRatio == null ? 'Log actual minutes on tasks to unlock this.'
    : s.estimateRatio > 115 ? 'Tasks run longer than you estimate. Try padding estimates.'
    : s.estimateRatio < 85 ? 'You finish faster than you estimate. Nice.' : 'Your estimates are right on target.';
  const pd = s.priorityDone;
  const totalPd = Math.max(1, pd.must + pd.should + pd.could);
  return `<div class="top"><h1>Insights</h1></div>
    <div class="tiles">
      <div class="tile"><b>🔥 ${s.streak}</b><span class="muted">day highlight streak</span></div>
      <div class="tile"><b>${s.bestStreak}</b><span class="muted">best streak</span></div>
      <div class="tile"><b>${s.highlightRate30}%</b><span class="muted">highlights done (30d)</span></div>
      <div class="tile"><b>${s.microRate30}%</b><span class="muted">micro-commitments (30d)</span></div>
    </div>
    <section class="card"><h2>Last 12 weeks</h2><p class="muted">Each square: highlight + micro-commitment + any task done.</p>
      <div class="heat" role="img" aria-label="Activity heatmap">${s.heatmap.map((d) => `<i data-s="${d.score}" title="${d.date}"></i>`).join('')}</div></section>
    <section class="card"><h2>Tasks finished per week</h2>
      <div class="bars">${s.weeks.map((w) => `<div title="${w.done} of ${w.total}"><span style="height:${(w.done / max) * 100}%"></span>${label(w.start)}</div>`).join('')}</div></section>
    <section class="card"><h2>Estimate accuracy</h2>
      <p style="font-size:1.6rem;font-weight:700;margin-top:6px">${s.estimateRatio == null ? '–' : `${s.estimateRatio}%`}</p>
      <p class="muted">${ratioNote}${s.timedCount ? ` (${s.timedCount} timed tasks)` : ''}</p></section>
    <section class="card"><h2>Finished by priority</h2>
      ${[['🎯 Must', pd.must], ['🗓️ Should', pd.should], ['💭 Could', pd.could]].map(([l, v]) => `<p class="muted" style="margin-top:8px">${l} · ${v}</p><div class="meter"><span style="width:${(v / totalPd) * 100}%"></span></div>`).join('')}
      <p class="muted" style="margin-top:12px">${s.skipped} tasks skipped in this window.</p></section>`;
}

function viewProjects() {
  const p = state.projects;
  if (!p) return '<p class="muted">Loading…</p>';
  const fmt = (d) => (d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '–');
  const left = (d) => (d ? Math.ceil((new Date(`${d.slice(0, 10)}T12:00:00`) - Date.now()) / 864e5) : null);
  return `<div class="top"><h1>Active Projects</h1></div>${p.length ? p.map((x) => {
    const pct = x.total ? Math.round((x.done / x.total) * 100) : 0;
    const days = left(x.end);
    return `<section class="card proj"><div class="row"><h2>${esc(x.name)}</h2><span class="chip">${esc(x.status ?? '')}</span></div>
      <div class="meter" role="img" aria-label="${pct}% complete"><span style="width:${pct}%"></span></div>
      <p class="muted" style="margin-top:8px">${x.done}/${x.total} tasks · ${fmt(x.start)} → ${fmt(x.end)}${days != null ? ` · ${days >= 0 ? `${days}d left` : `${-days}d overdue`}` : ''}</p></section>`;
  }).join('') : '<p class="empty">No active projects.</p>'}`;
}

function viewLogin(err = '') {
  return `<form class="login" data-form="login"><div class="logo">🌱</div><h1>Kaizen</h1>
    <p class="muted">Enter your passcode to continue.</p>
    <input type="password" name="passcode" placeholder="Passcode" autocomplete="current-password" required autofocus>
    <button class="btn">Sign in</button><p class="err" role="alert">${esc(err)}</p></form>`;
}

function render() {
  if (state.authed === false) {
    $('#tabs').hidden = true;
    app.innerHTML = viewLogin(state.loginError);
    return;
  }
  $('#tabs').hidden = false;
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
  const active = document.activeElement;
  const focusKey = active?.name && active.form?.dataset.form ? `${active.form.dataset.form}:${active.form.dataset.kind || ''}:${active.name}` : null;
  const draft = active?.tagName === 'INPUT' ? active.value : null;
  app.innerHTML = state.tab === 'today' ? viewToday() : state.tab === 'insights' ? viewInsights() : viewProjects();
  if (focusKey) {
    const [f, k, n] = focusKey.split(':');
    const el = app.querySelector(`form[data-form="${f}"]${k ? `[data-kind="${k}"]` : ''} [name="${n}"]`);
    if (el) { el.focus(); if (draft && !el.value) el.value = draft; }
  }
}

// ---- events ----------------------------------------------------------------

app.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const kind = form.dataset.form;
  if (kind === 'login') {
    try {
      await api('login', 'POST', { passcode: data.passcode });
      state.authed = true;
      state.loginError = '';
      await load('today');
    } catch (err) {
      state.loginError = err.message;
      render();
    }
    return;
  }
  form.querySelector('button').disabled = true;
  if (kind === 'brain') await act(() => api('brain', 'POST', { text: data.text }));
  if (kind === 'daily') {
    state.editing = {};
    await act(() => api(form.dataset.kind, 'POST', { name: data.name }));
  }
  if (kind === 'task') {
    await act(() => api('tasks', 'POST', { name: data.name, priority: data.priority, est: data.est, quick: Number(data.est) > 0 && Number(data.est) <= 5 }));
  }
});

app.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const { act: a, id, kind, text, k } = el.dataset;
  if (a === 'why') { state.open[k] = !state.open[k]; return render(); }
  if (a === 'edit-daily') { (state.editing ??= {})[kind] = true; return render(); }
  if (a === 'logout') { await api('logout', 'POST'); state.authed = false; return render(); }
  if (a === 'toggle-daily') {
    const done = el.dataset.done === 'true';
    const row = state.today[kind];
    row.done = done;
    el.classList.toggle('on', done);
    if (done) { el.classList.add('pop'); toast(kind === 'highlight' ? 'Highlight done. That is a win. 🎉' : 'Micro-commitment kept. 🌱'); }
    return act(() => api(kind, 'PATCH', { id, done }));
  }
  if (a === 'toggle-task') {
    el.classList.toggle('on', el.dataset.done === 'true');
    return act(() => api('tasks', 'PATCH', { id, done: el.dataset.done === 'true' }));
  }
  if (a === 'del-brain') return act(() => api('brain', 'DELETE', { id }));
  if (a === 'to-highlight') return act(() => api('highlight', 'POST', { name: text }));
  if (a === 'to-task') return act(() => api('tasks', 'POST', { name: text }));
  if (a === 'move-today') return act(() => api('tasks', 'PATCH', { id, due: 'today' }));
  if (a === 'skip') return act(() => api('tasks', 'PATCH', { id, status: 'Skipped' }));
});

$('#tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.tab = b.dataset.tab;
  render();
  load(state.tab, true);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.authed) load(state.tab, true);
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

(async () => {
  const s = await fetch('/api/session').then((r) => r.json()).catch(() => ({ authed: false }));
  state.authed = s.authed;
  if (s.authed) await load('today');
  else render();
})();
