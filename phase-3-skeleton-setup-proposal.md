# Phase 3: Functioning Second Brain MVP Proposal

**Status:** PROPOSAL ONLY — nothing has been created. No storage was touched to write this document.

Revision 2. This replaces the folders-only skeleton proposal: Phase 3 now delivers a **usable** Obsidian-based Second Brain starter system, not just empty folders. Numbered prefixes keep PARA order at the top of every file browser (ADHD-friendly: one obvious place to look, same order everywhere).

---

## 1. Functioning MVP Definition

The MVP is complete only when, after later approval, all of the following are true:

1. Google Drive has empty PARA file-cabinet folders.
2. Obsidian has empty PARA folders.
3. Obsidian has the starter notes listed in Section 4.
4. Starter notes use `[[double bracket links]]`.
5. Graph View shows a connected starter map (Section 6).
6. A Weekly Review note exists.
7. **No existing files have been moved or modified.**

iCloud is out of MVP scope — deferred to a later phase if still wanted.

## 2. Exact Google Drive folders to create (top level of My Drive)

```
00_Inbox
01_Projects
02_Areas
03_Resources
04_Archive
```

Created empty and left empty during Phase 3. Subfolders and file migration are Phase 4.

## 3. Exact Obsidian folders to create (vault root)

```
00_Inbox
01_Projects
02_Areas
03_Resources
04_Archive
05_Daily
06_Templates
```

Created empty. Starter notes (Section 4) live at the **vault root**, so these folders stay empty in Phase 3 — they are the filing structure; the starter notes are the map.

## 4. Exact Obsidian starter notes to create (14 notes, vault root)

| Note | Purpose |
|---|---|
| `Home.md` | Dashboard / single front door to everything |
| `Inbox.md` | Capture point; explains what lands in `00_Inbox` |
| `PARA.md` | One-page explanation of the PARA method |
| `CODE Workflow.md` | Capture → Organize → Distill → Express reference |
| `Weekly Review.md` | The weekly reset ritual (Section 8) |
| `Google Drive File Cabinet.md` | How the Drive folders mirror the vault (Section 7) |
| `Projects.md` | Index of active projects |
| `Areas.md` | Index of ongoing life/work areas |
| `Resources.md` | Index of reference material |
| `Archive.md` | What archived means; how things get here |
| `LaunchCode.md` | Project note |
| `Estately.md` | Project note |
| `Miss Mess Designs.md` | Project note |
| `Watercolor.md` | Project note |

Each note gets a short heading, 2–4 lines of purpose text, and its links from Section 5. Nothing else.

## 5. Starter note link map

- **`Home.md` links to:** [[Inbox]], [[PARA]], [[CODE Workflow]], [[Weekly Review]], [[Google Drive File Cabinet]], [[Projects]], [[Areas]], [[Resources]], [[Archive]], [[LaunchCode]], [[Estately]], [[Miss Mess Designs]], [[Watercolor]]
- **`PARA.md` links to:** [[Projects]], [[Areas]], [[Resources]], [[Archive]], [[Inbox]]
- **`Weekly Review.md` links to:** [[Inbox]], [[Projects]], [[Areas]], [[Resources]], [[Archive]]
- **`Google Drive File Cabinet.md` links to:** [[PARA]], [[Inbox]], [[Projects]], [[Areas]], [[Resources]], [[Archive]]
- **`Projects.md` links to:** [[LaunchCode]], [[Estately]], [[Miss Mess Designs]], [[Watercolor]] (so project notes connect back into the map)

## 6. Graph View expectation

After creation, opening Graph View shows one connected constellation with no orphan notes: `Home` as the hub linking to all 13 other notes; `PARA`, `Weekly Review`, and `Google Drive File Cabinet` forming a dense core around the four PARA index notes; the four project notes connected via `Home` and `Projects`. If any note appears disconnected, that is a defect to fix before Phase 3 is called done.

## 7. Google Drive role

Google Drive is the **file cabinet**; Obsidian is the **thinking space**. Files (PDFs, images, documents, spreadsheets) live in Drive's PARA folders; notes, ideas, and links live in the vault. `Google Drive File Cabinet.md` documents this split and mirrors the same `00`–`04` numbering, so "where does this go?" always has the same answer in both systems.

## 8. Weekly Review workflow

`Weekly Review.md` contains this checklist (once weekly, ~15 minutes):

1. Open [[Inbox]] — process captures: file, link, or delete each item.
2. Sweep the `00_Inbox` folders (vault and Drive) toward Projects/Areas/Resources/Archive.
3. Open [[Projects]] — for each project: still active? next action known? Stalled → [[Archive]].
4. Glance at [[Areas]] — anything needing attention this week?
5. Move anything finished or dead to [[Archive]].
6. Done. Close everything.

## 9. Safety rules

- **Create-only.** New empty folders and the 14 new starter notes above — nothing else.
- **No existing file or folder is moved, renamed, deleted, synced, edited, modified, opened, or reorganized.**
- **Name collision → stop.** If any proposed folder or note name already exists, stop and ask; never overwrite or merge.
- **No plugins, settings, sync, or automation changes** in Obsidian or anywhere else.
- **Git and LaunchCode repos are never entered** (the `LaunchCode.md` note only links *about* the work; it does not touch any repo).
- **Anything unexpected → stop and report.**
- **Hard stop at the phase boundary.** No cleanup or migration under Phase 3 approval.

**Order if approved:** (1) Google Drive folders → evidence; (2) Obsidian folders → evidence; (3) Obsidian starter notes → evidence incl. Graph View; stop.

## 10. Required approval phrase

Nothing is created until you send exactly:

> **APPROVED: CREATE FUNCTIONING SECOND BRAIN MVP**

Anything else — including "looks good", "go ahead", or partial phrases — does not count as approval.

## 11. Evidence to show after creation (if approved later)

- Google Drive: list of the 5 folders created, their location, confirmation each is empty.
- Obsidian: list of the 7 folders created, confirmation each is empty.
- Obsidian: list of the 14 notes created with their full contents.
- A link check: every link in Section 5 resolves to an existing note (no broken/orphan links).
- Graph View screenshot or equivalent confirmation of one connected starter map.
- Confirmation that zero existing files/folders were moved, renamed, modified, or deleted.
- Timestamp of each step.

---

**Next step after this proposal:** nothing, until you either request changes or send the approval phrase.
