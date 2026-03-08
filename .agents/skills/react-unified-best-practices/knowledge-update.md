# Update React Unified Best Practices

## Overview

A command to add, change, or remove content from `react-unified-best-practices` while keeping all files consistent.

1. Asks what change is needed
2. Auto-determines the operation — no need to specify
3. Executes with all constraints enforced
4. Updates `SKILL.md` registry automatically
5. Confirms what was done and offers to apply the rule to existing code

---

## Skill Structure

```
.agents/skills/react-unified-best-practices/
├── SKILL.md                     # Thin index + File Registry (always updated)
├── knowledge-update.md          # This file
├── patterns-mvvm.md             # Full MVVM implementation examples
├── patterns-compound.md         # Full Compound implementation examples
└── rules/
    ├── arch-folder-structure.md # Single source of truth for all paths
    ├── arch-*.md                # Architectural rules
    └── standards-*.md           # Code standard rules
```

---

## Step 1: Capture the Change

When `/update-react-skill` is run:

1. Ask: "What would you like to change in the React best practices skill?"
2. Ask: "Any source to reference? (file, URL, or paste content)" [optional]
3. **Auto-determine the operation** — do NOT ask the user to choose:
   - New concern not covered by any existing rule → **Add rule**
   - Change to an existing rule's behavior → **Update rule**
   - New detailed code examples for an existing rule → **Add pattern file**
   - New source document with multiple rules → **Merge source**
   - Two rules that disagree → **Flag conflict**
   - Rule no longer applies → **Remove rule**
   - Directory path changed → **Update folder structure**
   - Only ask if genuinely ambiguous between two operations
4. Read `SKILL.md` to check whether a similar rule already exists:
   - If exists: propose updating it instead of creating a new file
   - If not: proceed to create
5. Execute the operation following Step 2

---

## Step 2: Execute the Operation

### Add Rule

1. Determine the prefix:
   - Structural or pattern rule → `arch-`
   - Code style or convention rule → `standards-`
2. Name the file in `kebab-case` using the user's exact description — do not paraphrase
3. Create `rules/<name>.md` using the **Rule File Template** below
4. Add a one-liner to `SKILL.md` Quick Reference under the correct category
5. Add a row to `SKILL.md` File Registry with scope and dependencies
6. If the rule contradicts an existing rule → add an entry to `conflicts.md`
7. If the rule extends `code-review-agent` without conflicting → add a row to `agent-extensions.md`

### Update Rule

1. Read the current `rules/<name>.md`
2. Apply only within the file's existing scope — if the update adds a second concern, extract it into a new rule file instead
3. Update the one-liner in `SKILL.md` File Registry if the scope description changed
4. If the update involves a path → edit `arch-folder-structure.md` instead of the rule file

### Add Pattern File

1. Create `patterns-<name>.md` using the **Pattern File Template** below
2. Add a "For full implementation: `patterns-<name>.md`" link at the bottom of the corresponding rule file
3. Add a row to the Supporting Files table in `SKILL.md`

### Merge Source

1. Read the source and current `SKILL.md`
2. For each distinct rule extracted from the source:
   - If it matches an existing rule's scope → update that file
   - If it is a new concern → create a new rule file (follow Add Rule steps)
   - If it duplicates an existing rule → skip
   - If it contradicts an existing rule → add to `conflicts.md`
3. Update `SKILL.md` Quick Reference and File Registry for any new files

### Flag / Resolve Conflict

1. Add a numbered section to `conflicts.md`
2. Add `> See conflicts.md §N` in the affected rule file(s)
3. If a resolution is provided, apply it to the rule file

### Remove Rule

1. Delete `rules/<name>.md`
2. Remove it from `SKILL.md` Quick Reference and File Registry
3. Remove any `Depends On` references to it in other rule files
4. If a `patterns-<name>.md` only exists for this rule, delete it too

### Update Folder Structure

1. Edit `arch-folder-structure.md` only
2. Do NOT update any other rule file — they reference it by name

---

## Rule File Template

```markdown
# <rule-name>

One sentence describing the single concern this rule enforces.

Paths: `arch-folder-structure.md` → `src/<relevant-path>/`   ← only if paths are referenced

## Rules

- Rule 1
- Rule 2

## Incorrect

\`\`\`tsx
// ❌ explanation
\`\`\`

## Correct

\`\`\`tsx
// ✅ explanation
\`\`\`

Depends on: `<other-rule>` ← only if applicable
```

---

## Pattern File Template

```markdown
# patterns-<name>

Full implementation. Rule overview: `rules/<rule-name>.md`.

## File Structure

\`\`\`
...
\`\`\`

## <Section per logical part>

\`\`\`tsx
// full code
\`\`\`
```

---

## Step 3: Confirm

After completing, display:

```
✓ [Operation]: <file(s) changed>
✓ Updated: SKILL.md

📐 Skill Updated:
---
Operation : [Add rule | Update rule | ...]
File(s)   : <list of created/modified files>
Concern   : <one-line scope of the change>
---

Would you like me to apply this rule to existing code?
```

If yes: read the updated rule file and apply it to the relevant files in the project.

---

## Constraints (always enforced)

- **One concern per file.** Split rather than mix.
- **Paths in `arch-folder-structure.md` only.** Never hardcode `src/...` paths in rule files.
- **`SKILL.md` is the only index.** Register every new file there.
- **No performance rules.** Those belong in `vercel-react-best-practices`. Cross-reference at most.
- **`conflicts.md` for disagreements.** Never silently overwrite a contradicting rule.
- **`agent-extensions.md` rows only grow.** Mark rows as resolved rather than deleting them.
