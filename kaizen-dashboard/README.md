# Kaizen Dashboard

Mobile-first wrapper for the Ruri Ohama Kaizen system in Notion. Notion stays the source of truth; every action writes back to your existing databases.

## What it does

| Kaizen step | Dashboard behavior | Notion target |
| :--- | :--- | :--- |
| Daily log | Created on first write, using the database's default template | Kaizen Log |
| Brain Dump | Add/delete bullets; ⭐ promotes to Highlight, ✅ to a to-do | Bullets inside the log's 🧠 callout |
| Daily Highlight | Set, edit, check off | Daily-Highlight |
| Micro-Commitment | Set, edit, check off | Micro-Commitment |
| To-do's | Add, check off, priority, minutes | Task Database (Due Date = today) |
| Carry-forward | Move overdue tasks to today or Skip | Task Database |
| Insights | Streaks, 12-week heatmap, weekly output, estimate accuracy | Computed from the above |
| Projects | Progress from related tasks | Projects |

## Setup

1. **Notion integration:** notion.so/profile/integrations → New integration (internal) → copy the secret. Capabilities: read, update, insert content.
2. **Share access:** open *Kaizen System Master Page* → ••• → Connections → add your integration.
3. **Env vars** (see `.env.example`): `NOTION_TOKEN`, `PASSCODE`, `SESSION_SECRET`.
4. **Try it offline:** `npm install && npm run mock` → http://localhost:3000 (passcode `demo`, fake data).
5. **Run against Notion:** `cp .env.example .env`, fill it in, then `node --env-file=.env server.js`.
6. **Deploy:** import the repo in Vercel, set Root Directory to `kaizen-dashboard`, add the three env vars.
7. **Phone:** open the Vercel URL in Safari → Share → Add to Home Screen.

## Notes

- Dates use `America/Chicago` (override with `TZ_NAME`).
- The database IDs can be overridden with `DS_LOG`, `DS_HIGHLIGHT`, `DS_MICRO`, `DS_TASKS`, `DS_PROJECTS` if you ever re-duplicate the template.
- Login is a single shared passcode with a 30-day signed cookie. Use a long passcode; the Notion token never reaches the browser.
- Mock mode was tested end to end. The Notion calls were written against your database schemas but have not yet run against your live workspace.
