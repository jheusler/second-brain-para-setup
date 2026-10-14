import { addDays, weekStart } from './dates.js';

// Pure function: shared by the Notion store and the mock store.
// highlights/micros: [{ date, done }]   tasks: [{ due, done, status, priority, est, actual }]
export function computeInsights({ today, highlights, micros, tasks }) {
  const doneOn = (rows) => new Set(rows.filter((r) => r.done).map((r) => r.date));
  const hl = doneOn(highlights);
  const mc = doneOn(micros);
  const tasksDone = new Set(tasks.filter((t) => t.done).map((t) => t.due));

  // Streak: consecutive days with a completed highlight. Today may still be in progress.
  let streak = 0;
  let cursor = hl.has(today) ? today : addDays(today, -1);
  while (hl.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  const sorted = [...hl].sort();
  let best = 0;
  let run = 0;
  sorted.forEach((d, i) => {
    run = i && addDays(sorted[i - 1], 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
  });

  const heatmap = [];
  for (let i = 83; i >= 0; i--) {
    const date = addDays(today, -i);
    heatmap.push({ date, score: Number(hl.has(date)) + Number(mc.has(date)) + Number(tasksDone.has(date)) });
  }

  const rate = (set, days) => {
    let n = 0;
    for (let i = 0; i < days; i++) n += set.has(addDays(today, -i)) ? 1 : 0;
    return Math.round((n / days) * 100);
  };

  const weeks = [];
  const thisWeek = weekStart(today);
  for (let w = 7; w >= 0; w--) {
    const start = addDays(thisWeek, -7 * w);
    const end = addDays(start, 6);
    const inWeek = tasks.filter((t) => t.due && t.due >= start && t.due <= end);
    weeks.push({ start, done: inWeek.filter((t) => t.done).length, total: inWeek.length });
  }

  const timed = tasks.filter((t) => t.done && t.est > 0 && t.actual > 0);
  const estimateRatio = timed.length
    ? Math.round((timed.reduce((s, t) => s + t.actual / t.est, 0) / timed.length) * 100)
    : null;

  const priorityDone = { must: 0, should: 0, could: 0 };
  for (const t of tasks) {
    if (!t.done) continue;
    if (t.priority?.includes('Must')) priorityDone.must++;
    else if (t.priority?.includes('Should')) priorityDone.should++;
    else if (t.priority?.includes('Could')) priorityDone.could++;
  }

  return {
    streak,
    bestStreak: best,
    highlightRate30: rate(hl, 30),
    microRate30: rate(mc, 30),
    heatmap,
    weeks,
    estimateRatio,
    timedCount: timed.length,
    priorityDone,
    skipped: tasks.filter((t) => t.status === 'Skipped').length,
  };
}
