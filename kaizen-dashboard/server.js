// Local dev server: serves /public and routes /api/* to the same handler Vercel uses.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from './api/index.js';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
};

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  if (pathname.startsWith('/api')) return handler(req, res);
  const rel = normalize(pathname === '/' ? '/index.html' : pathname);
  if (rel.includes('..')) return res.writeHead(400).end();
  try {
    const data = await readFile(join(root, rel));
    res.writeHead(200, { 'Content-Type': types[extname(rel)] || 'application/octet-stream' }).end(data);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(process.env.PORT || 3000, () => console.log(`Kaizen dashboard on http://localhost:${process.env.PORT || 3000}`));
