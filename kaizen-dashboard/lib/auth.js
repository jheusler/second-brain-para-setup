import { createHmac, timingSafeEqual } from 'node:crypto';

const DAYS = 30;
const secret = () => process.env.SESSION_SECRET || process.env.PASSCODE || '';
const sign = (v) => createHmac('sha256', secret()).update(v).digest('hex');

const safeEq = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export const checkPasscode = (input) =>
  Boolean(process.env.PASSCODE) && safeEq(input ?? '', process.env.PASSCODE);

export const makeCookie = (secure) => {
  const exp = String(Date.now() + DAYS * 864e5);
  const flags = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${secure ? '; Secure' : ''}`;
  return `kz=${exp}.${sign(exp)}; ${flags}`;
};

export const clearCookie = () => 'kz=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

export const isAuthed = (req) => {
  if (!secret()) return false;
  const m = /(?:^|;\s*)kz=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return false;
  const [exp, mac] = m[1].split('.');
  return Boolean(mac) && Number(exp) > Date.now() && safeEq(mac, sign(exp));
};
