import { checkPasscode, clearCookie, isAuthed, makeCookie } from '../lib/auth.js';
import { todayStr } from '../lib/dates.js';

const store = process.env.MOCK
  ? (await import('../lib/mock.js')).store
  : (await import('../lib/notion.js')).store;

const KINDS = new Set(['highlight', 'micro']);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const send = (res, code, body, headers = {}) => {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
};

const readBody = async (req) => {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
};

const clean = (s, max = 500) => String(s ?? '').trim().slice(0, max);
const need = (v, msg) => {
  if (!v) throw Object.assign(new Error(msg), { status: 400 });
  return v;
};

export default async function handler(req, res) {
  try {
    const { pathname, searchParams } = new URL(req.url, 'http://x');
    const route = pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
    const secure = (req.headers['x-forwarded-proto'] || '').includes('https');
    const method = req.method;

    if (method !== 'GET' && !(req.headers['content-type'] || '').includes('application/json')) {
      return send(res, 415, { error: 'JSON only' });
    }

    if (route === 'login' && method === 'POST') {
      const { passcode } = await readBody(req);
      if (!checkPasscode(passcode)) {
        await new Promise((r) => setTimeout(r, 600));
        return send(res, 401, { error: 'Wrong passcode' });
      }
      return send(res, 200, { ok: true }, { 'Set-Cookie': makeCookie(secure) });
    }
    if (route === 'logout' && method === 'POST') return send(res, 200, { ok: true }, { 'Set-Cookie': clearCookie() });
    if (route === 'session') return send(res, 200, { authed: isAuthed(req), mock: Boolean(process.env.MOCK) });
    if (!isAuthed(req)) return send(res, 401, { error: 'Not signed in' });

    const dateParam = searchParams.get('date');
    const date = DATE.test(dateParam || '') ? dateParam : todayStr();
    const body = method === 'GET' ? {} : await readBody(req);
    const bodyDate = DATE.test(body.date || '') ? body.date : date;

    if (route === 'today' && method === 'GET') return send(res, 200, await store.today(date));
    if (route === 'insights' && method === 'GET') return send(res, 200, await store.insights(date));
    if (route === 'projects' && method === 'GET') return send(res, 200, await store.projects());

    if (route === 'brain' && method === 'POST') {
      return send(res, 200, await store.addBrain(bodyDate, need(clean(body.text), 'Text required')));
    }
    if (route === 'brain' && method === 'DELETE') {
      await store.deleteBrain(need(clean(body.id, 64), 'id required'));
      return send(res, 200, { ok: true });
    }

    const daily = /^(highlight|micro)$/.exec(route);
    if (daily && KINDS.has(daily[1])) {
      if (method === 'POST') return send(res, 200, await store.setDaily(daily[1], bodyDate, need(clean(body.name), 'Text required')));
      if (method === 'PATCH') return send(res, 200, await store.toggleDaily(daily[1], need(clean(body.id, 64), 'id required'), Boolean(body.done)));
    }

    if (route === 'tasks' && method === 'POST') {
      const est = Number(body.est);
      return send(res, 200, await store.addTask({
        name: need(clean(body.name, 200), 'Name required'),
        date: bodyDate,
        priority: clean(body.priority, 20) || undefined,
        est: est > 0 ? est : undefined,
        quick: Boolean(body.quick),
      }));
    }
    if (route === 'tasks' && method === 'PATCH') {
      const patch = {};
      if ('done' in body) patch.done = Boolean(body.done);
      if (['Not started', 'In progress', 'Done', 'Skipped'].includes(body.status)) patch.status = body.status;
      if (body.due === 'today') patch.due = todayStr();
      else if (DATE.test(body.due || '')) patch.due = body.due;
      if (Number(body.actual) >= 0 && 'actual' in body) patch.actual = Number(body.actual);
      return send(res, 200, await store.updateTask(need(clean(body.id, 64), 'id required'), patch));
    }

    return send(res, 404, { error: 'Not found' });
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    return send(res, status, { error: status === 500 ? 'Something went wrong talking to Notion' : err.message });
  }
}
