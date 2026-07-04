# Phase 3: Skeleton Setup Proposal

**Status:** PROPOSAL ONLY — nothing has been created. No storage was touched to write this document.

This proposes the empty PARA skeleton to be created in a later, separately approved step. Numbered prefixes keep PARA order at the top of every file browser (ADHD-friendly: one obvious place to look, same order everywhere).

---

## 1. Google Drive — proposed empty folders (top level of My Drive)

```
00_Inbox
01_Projects
02_Areas
03_Resources
04_Archive
```

- Top level only. No subfolders yet — Project/Area subfolders get proposed during migration mapping (Phase 4), after we know what's moving where.
- All existing Drive folders stay exactly where they are, untouched, until migration is separately approved.

## 2. Obsidian — proposed empty folders (inside the vault, at vault root)

```
00_Inbox
01_Projects
02_Areas
03_Resources
04_Archive
05_Daily
06_Templates
```

- `05_Daily` for daily notes, `06_Templates` for note templates — notes-only needs that don't exist on the file-storage side.
- Folders only. No notes, no template files, no plugin or settings changes.
- Note: the vault lives on local/iCloud storage, so this step only happens under the same approval as everything else.

## 3. iCloud Drive — proposed light skeleton (top level)

```
00_Inbox
01_Projects
04_Archive
```

- Deliberately light: iCloud is for files in active motion on Apple devices. Reference material (`02_Areas`, `03_Resources`) lives in Google Drive to avoid maintaining two full PARA trees.
- Numbering matches Drive so the same number means the same thing everywhere.

## 4. What will NOT be created locally

- No folders on the local Mac outside the Obsidian vault — nothing in Desktop, Documents, Downloads, or home directory.
- No local duplicate/mirror of the PARA tree.
- No new Git repos, and nothing inside existing Git or LaunchCode repos (never entered per permanent rules).
- No symlinks, sync tools, automations, or app config changes.

## 5. Order of operations (only if folder creation is later approved)

1. **Google Drive** — create the 5 folders, verify, show evidence (Section 8). Stop.
2. **Obsidian vault** — create the 7 folders, verify, show evidence. Stop.
3. **iCloud Drive** — create the 3 folders, verify, show evidence. Stop.
4. Report completion. **Phase 3 ends here.** No files are moved into anything — that is Phase 4 and requires its own proposal and approval.

One platform at a time; a problem on one platform halts the whole sequence.

## 6. Safety rules for Phase 3

- **Create-only.** Empty folders only. Nothing is moved, renamed, deleted, edited, synced, or reorganized.
- **Nothing goes inside** the new folders during Phase 3.
- **Existing folders and files are never touched**, opened, or read beyond names needed to place the new folders.
- **Name collision → stop.** If a proposed folder name already exists, stop and ask; never merge into or modify the existing folder.
- **Anything unexpected → stop and report** rather than improvise.
- **Hard stop at the phase boundary.** No migration, cleanup, or file moves under Phase 3 approval.

## 7. Required approval phrase

No folders are created until you send exactly:

> **APPROVED: CREATE PHASE 3 SKELETON**

Anything else — including "looks good", "go ahead", or partial phrases — does not count as approval.

## 8. Evidence shown after creation (if approved later)

Per platform, immediately after its step:

- The exact list of folder names created and their parent location.
- Count created vs. count proposed (must match: Drive 5, Obsidian 7, iCloud 3).
- Confirmation each new folder is empty.
- Confirmation that zero existing files/folders were moved, renamed, modified, or deleted.
- Timestamp of the operation.

---

**Next step after this proposal:** nothing, until you either request changes to this proposal or send the approval phrase.
