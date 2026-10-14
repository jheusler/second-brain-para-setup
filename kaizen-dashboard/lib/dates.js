export const TZ = process.env.TZ_NAME || 'America/Chicago';

export const todayStr = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now);

export const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Monday of the week containing ymd
export const weekStart = (ymd) => {
  const dow = (new Date(`${ymd}T12:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(ymd, -dow);
};
