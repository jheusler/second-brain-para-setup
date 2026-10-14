import { Client } from '@notionhq/client';
import { addDays } from './dates.js';
import { computeInsights } from './insights.js';

const DS = {
  log: process.env.DS_LOG || '70655fcf-9539-822d-913b-07883569677f',
  highlight: process.env.DS_HIGHLIGHT || 'ce955fcf-9539-82b1-b021-871b73ac72ff',
  micro: process.env.DS_MICRO || 'efa55fcf-9539-83c0-89fd-87953c6c10ed',
  tasks: process.env.DS_TASKS || '02a55fcf-9539-82ff-bd65-876dac0dbb8c',
  projects: process.env.DS_PROJECTS || 'ed655fcf-9539-82d8-a56b-87c8941d926a',
};
const DAILY_TITLE = { highlight: 'Name', micro: 'Goal' };

const notion = new Client({ auth: process.env.NOTION_TOKEN, notionVersion: '2025-09-03' });

const txt = (rt = []) => rt.map((t) => t.plain_text).join('');
const rich = (s) => [{ type: 'text', text: { content: s } }];

async function queryAll(source, params = {}) {
  const out = [];
  let cursor;
  do {
    const r = await notion.dataSources.query({
      data_source_id: DS[source],
      page_size: 100,
      start_cursor: cursor,
      ...params,
    });
    out.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return out;
}

async function listChildren(blockId) {
  const out = [];
  let cursor;
  do {
    const r = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 });
    out.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return out;
}

const daily = (p, kind) => ({
  id: p.id,
  name: txt(p.properties[DAILY_TITLE[kind]]?.title),
  done: Boolean(p.properties['Completed?']?.checkbox),
  date: p.properties.Date?.date?.start?.slice(0, 10) ?? null,
});

const task = (p) => {
  const pr = p.properties;
  return {
    id: p.id,
    name: txt(pr['Task Name']?.title),
    done: Boolean(pr['Done?']?.checkbox),
    status: pr['Task Status']?.status?.name ?? null,
    priority: pr.Priority?.select?.name ?? null,
    est: pr['Estimated (min)']?.number ?? null,
    actual: pr['Actual (min)']?.number ?? null,
    quick: Boolean(pr['Quick Task? ']?.checkbox),
    due: pr['Due Date']?.date?.start?.slice(0, 10) ?? null,
    projectIds: (pr['Related Project']?.relation ?? []).map((r) => r.id),
  };
};

// ---- Kaizen log + brain dump -------------------------------------------------

async function findLog(date) {
  const r = await notion.dataSources.query({
    data_source_id: DS.log,
    filter: { property: 'Date', date: { equals: date } },
    page_size: 1,
  });
  return r.results[0] ?? null;
}

async function ensureLog(date) {
  const existing = await findLog(date);
  if (existing) return existing;
  const props = { Name: { title: rich(`${date} — Kaizen`) }, Date: { date: { start: date } } };
  const parent = { type: 'data_source_id', data_source_id: DS.log };
  try {
    // Use the database's default template so the page matches the original Kaizen layout.
    return await notion.pages.create({ parent, properties: props, icon: { type: 'emoji', emoji: '🌱' }, template: { type: 'default' } });
  } catch {
    return notion.pages.create({ parent, properties: props, icon: { type: 'emoji', emoji: '🌱' } });
  }
}

const isBrainCallout = (b) =>
  b.type === 'callout' && (b.callout.icon?.emoji === '🧠' || txt(b.callout.rich_text).trim().startsWith('Brain Dump'));

async function brainCallout(logId, create) {
  const blocks = await listChildren(logId);
  const found = blocks.find(isBrainCallout);
  if (found || !create) return found ?? null;
  const r = await notion.blocks.children.append({
    block_id: logId,
    children: [{ type: 'callout', callout: { icon: { type: 'emoji', emoji: '🧠' }, rich_text: rich('Brain Dump') } }],
  });
  return r.results[0];
}

async function readBrain(logId) {
  const callout = await brainCallout(logId, false);
  if (!callout) return [];
  const kids = await listChildren(callout.id);
  return kids
    .filter((b) => b.type === 'bulleted_list_item' && txt(b.bulleted_list_item.rich_text).trim())
    .map((b) => ({ id: b.id, text: txt(b.bulleted_list_item.rich_text) }));
}

async function addBrain(date, text) {
  const log = await ensureLog(date);
  const callout = await brainCallout(log.id, true);
  const kids = await listChildren(callout.id);
  // Reuse the template's empty placeholder bullets before appending new ones.
  const blank = kids.find((b) => b.type === 'bulleted_list_item' && !txt(b.bulleted_list_item.rich_text).trim());
  if (blank) {
    await notion.blocks.update({ block_id: blank.id, bulleted_list_item: { rich_text: rich(text) } });
    return { id: blank.id, text };
  }
  const r = await notion.blocks.children.append({
    block_id: callout.id,
    children: [{ type: 'bulleted_list_item', bulleted_list_item: { rich_text: rich(text) } }],
  });
  return { id: r.results[0].id, text };
}

// ---- Public store ------------------------------------------------------------

export const store = {
  async today(date) {
    const [log, hl, mc, due, overdue] = await Promise.all([
      findLog(date),
      queryAll('highlight', { filter: { property: 'Date', date: { equals: date } } }),
      queryAll('micro', { filter: { property: 'Date', date: { equals: date } } }),
      queryAll('tasks', { filter: { property: 'Due Date', date: { equals: date } } }),
      queryAll('tasks', {
        filter: {
          and: [
            { property: 'Due Date', date: { before: date } },
            { property: 'Done?', checkbox: { equals: false } },
            { property: 'Task Status', status: { does_not_equal: 'Skipped' } },
          ],
        },
      }),
    ]);
    return {
      date,
      logUrl: log?.url ?? null,
      brainDump: log ? await readBrain(log.id) : [],
      highlight: hl[0] ? daily(hl[0], 'highlight') : null,
      micro: mc[0] ? daily(mc[0], 'micro') : null,
      tasks: due.map(task),
      overdue: overdue.map(task),
    };
  },

  addBrain,

  async deleteBrain(id) {
    await notion.blocks.delete({ block_id: id });
  },

  async setDaily(kind, date, name) {
    const existing = await queryAll(kind, { filter: { property: 'Date', date: { equals: date } } });
    const props = { [DAILY_TITLE[kind]]: { title: rich(name) } };
    if (existing[0]) {
      const p = await notion.pages.update({ page_id: existing[0].id, properties: props });
      return daily(p, kind);
    }
    await ensureLog(date);
    const p = await notion.pages.create({
      parent: { type: 'data_source_id', data_source_id: DS[kind] },
      properties: { ...props, Date: { date: { start: date } }, 'Completed?': { checkbox: false } },
    });
    return daily(p, kind);
  },

  async toggleDaily(kind, id, done) {
    const p = await notion.pages.update({ page_id: id, properties: { 'Completed?': { checkbox: done } } });
    return daily(p, kind);
  },

  async addTask({ name, date, priority, est, quick }) {
    const properties = {
      'Task Name': { title: rich(name) },
      'Due Date': { date: { start: date } },
      'Task Status': { status: { name: 'Not started' } },
    };
    if (priority) properties.Priority = { select: { name: priority } };
    if (est) properties['Estimated (min)'] = { number: est };
    if (quick) properties['Quick Task? '] = { checkbox: true };
    const p = await notion.pages.create({ parent: { type: 'data_source_id', data_source_id: DS.tasks }, properties });
    return task(p);
  },

  async updateTask(id, patch) {
    const properties = {};
    if ('done' in patch) {
      properties['Done?'] = { checkbox: patch.done };
      properties['Task Status'] = { status: { name: patch.done ? 'Done' : 'Not started' } };
    }
    if (patch.status) {
      properties['Task Status'] = { status: { name: patch.status } };
      properties['Done?'] = { checkbox: patch.status === 'Done' };
    }
    if (patch.due) properties['Due Date'] = { date: { start: patch.due } };
    if ('actual' in patch) properties['Actual (min)'] = { number: patch.actual };
    const p = await notion.pages.update({ page_id: id, properties });
    return task(p);
  },

  async insights(date) {
    const from = addDays(date, -83);
    const [h, m, t] = await Promise.all([
      queryAll('highlight', { filter: { property: 'Date', date: { on_or_after: from } } }),
      queryAll('micro', { filter: { property: 'Date', date: { on_or_after: from } } }),
      queryAll('tasks', { filter: { property: 'Due Date', date: { on_or_after: from } } }),
    ]);
    return computeInsights({
      today: date,
      highlights: h.map((p) => daily(p, 'highlight')),
      micros: m.map((p) => daily(p, 'micro')),
      tasks: t.map(task),
    });
  },

  async projects() {
    const [projects, tasks] = await Promise.all([
      queryAll('projects', { filter: { property: 'Project Status', status: { does_not_equal: '🟢 Complete' } } }),
      queryAll('tasks', { filter: { property: 'Related Project', relation: { is_not_empty: true } } }),
    ]);
    const parsed = tasks.map(task);
    return projects.map((p) => {
      const mine = parsed.filter((t) => t.projectIds.includes(p.id));
      const done = mine.filter((t) => t.done).length;
      return {
        id: p.id,
        name: txt(p.properties.Name?.title),
        status: p.properties['Project Status']?.status?.name ?? null,
        start: p.properties['Start Date']?.date?.start ?? null,
        end: p.properties['End Date/Deadline']?.date?.start ?? null,
        done,
        total: mine.length,
      };
    });
  },
};
