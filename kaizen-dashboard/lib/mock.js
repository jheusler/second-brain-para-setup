import { randomUUID } from 'node:crypto';
import { addDays, todayStr } from './dates.js';
import { computeInsights } from './insights.js';

// In-memory stand-in for Notion so the UI can be developed and tested offline (MOCK=1).
const id = () => randomUUID();
const today0 = todayStr();
const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const rand = rng(42);

const db = { highlight: [], micro: [], tasks: [], brain: {}, projects: [] };

const projects = [
  { id: id(), name: 'LaunchCode Final Project', status: '🟡 In Progress', start: addDays(today0, -30), end: addDays(today0, 45) },
  { id: id(), name: 'Bone, Hugs & Harmony: Fall Promo', status: '⚪ Not Started', start: addDays(today0, 3), end: addDays(today0, 30) },
];
db.projects = projects;

for (let i = 1; i <= 60; i++) {
  const date = addDays(today0, -i);
  const good = rand() > 0.3;
  db.highlight.push({ id: id(), name: 'Finish one focused work block', done: good, date });
  db.micro.push({ id: id(), name: 'Open the editor', done: rand() > 0.25, date });
  for (let k = 0; k < 3; k++) {
    const done = rand() > 0.3;
    const est = [15, 30, 45, 60][Math.floor(rand() * 4)];
    db.tasks.push({
      id: id(), name: ['Walk dogs', 'Study JS lesson', 'Invoice client', 'Estate sale route'][k % 4], done,
      status: done ? 'Done' : rand() > 0.5 ? 'Skipped' : 'Not started',
      priority: ['🎯 Must Do', '🗓️ Should Do', '💭 Could Do'][k], est,
      actual: done ? Math.round(est * (0.8 + rand() * 0.8)) : null, quick: k === 2, due: date,
      projectIds: k === 1 ? [projects[0].id] : [],
    });
  }
}
db.tasks.push(
  { id: id(), name: 'Draft promo flyer', done: false, status: 'Not started', priority: '🗓️ Should Do', est: 30, actual: null, quick: false, due: today0, projectIds: [projects[1].id] },
  { id: id(), name: 'Push README update', done: false, status: 'Not started', priority: '🎯 Must Do', est: 20, actual: null, quick: true, due: today0, projectIds: [projects[0].id] },
);
db.brain[today0] = [{ id: id(), text: 'Text Dan about payment' }];

const daily = (kind) => db[kind];
const findDay = (kind, date) => daily(kind).find((r) => r.date === date) ?? null;

export const store = {
  async today(date) {
    return {
      date,
      logUrl: null,
      brainDump: db.brain[date] ?? [],
      highlight: findDay('highlight', date),
      micro: findDay('micro', date),
      tasks: db.tasks.filter((t) => t.due === date),
      overdue: db.tasks.filter((t) => t.due < date && !t.done && t.status !== 'Skipped').slice(0, 5),
    };
  },
  async addBrain(date, text) {
    const item = { id: id(), text };
    (db.brain[date] ??= []).push(item);
    return item;
  },
  async deleteBrain(blockId) {
    for (const k of Object.keys(db.brain)) db.brain[k] = db.brain[k].filter((b) => b.id !== blockId);
  },
  async setDaily(kind, date, name) {
    const row = findDay(kind, date);
    if (row) return Object.assign(row, { name });
    const fresh = { id: id(), name, done: false, date };
    daily(kind).push(fresh);
    return fresh;
  },
  async toggleDaily(kind, rowId, done) {
    return Object.assign(daily(kind).find((r) => r.id === rowId), { done });
  },
  async addTask({ name, date, priority, est, quick }) {
    const t = { id: id(), name, done: false, status: 'Not started', priority: priority ?? null, est: est ?? null, actual: null, quick: Boolean(quick), due: date, projectIds: [] };
    db.tasks.push(t);
    return t;
  },
  async updateTask(taskId, patch) {
    const t = db.tasks.find((x) => x.id === taskId);
    if ('done' in patch) Object.assign(t, { done: patch.done, status: patch.done ? 'Done' : 'Not started' });
    if (patch.status) Object.assign(t, { status: patch.status, done: patch.status === 'Done' });
    if (patch.due) t.due = patch.due;
    if ('actual' in patch) t.actual = patch.actual;
    return t;
  },
  async insights(date) {
    return computeInsights({ today: date, highlights: db.highlight, micros: db.micro, tasks: db.tasks });
  },
  async projects() {
    return db.projects.map((p) => {
      const mine = db.tasks.filter((t) => t.projectIds.includes(p.id));
      return { ...p, done: mine.filter((t) => t.done).length, total: mine.length };
    });
  },
};
