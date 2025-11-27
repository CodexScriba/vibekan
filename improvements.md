# Vibekan Pre-Ship Improvements

**Date:** 2025-11-26
**Purpose:** Final implementation pass before v1 ship. This document combines high-level goals with specific implementation details and file maps.

---

## Improvements to Implement

### 1. Rename "Chat" Stage → "Idea" (✅ Completed & tested)
**Status:** Implemented. Tests passing: `src/__tests__/rename_stage.test.tsx`.
**Goal:** Rename the initial stage from "chat" to "Idea" to better reflect its purpose as the starting point for new tasks.
**Rationale:** "Idea" implies a concept waiting to be developed, whereas "Chat" implies a communication channel.
**Changes:**
- **State:**
  - **Current:** Stage union/labels/icons use `chat` in `src/types/task.ts`; default stage in `TaskModal.tsx` is `chat`; scaffolding creates `tasks/chat`.
  - **New:** Rename slug to `idea`, label to "Idea", icon to lightbulb. Update stage order.
- **Files to Edit:**
  - `src/types/task.ts` (Stage definitions)
  - `src/components/TaskModal.tsx` (Default stage)
  - `src/extension.ts` (STAGES constant, scaffolding logic)
  - `src/components/Board.tsx`, `Column.tsx`, `TaskTree.tsx` (UI labels/icons)
  - `.vibekan/_context/stages/chat.md` → `idea.md` (Context file rename)
  - `.vibekan/tasks/chat/` → `idea/` (Folder rename)
**Implementation Details:**
- Scaffold `.vibekan/tasks/idea` and `_context/stages/idea.md`.
- Optionally migrate existing workspaces by moving `tasks/chat` and stage context file if present.
- Update all references in the tree view and board.

#### Vitest Tests
- **File:** `src/__tests__/rename_stage.test.tsx`
- **Test Cases:**
  1. Verify that the stage enum includes `idea` and excludes `chat`.
  2. Ensure default stage in the task creation modal is `idea`.
  3. Confirm that scaffolding creates `.vibekan/tasks/idea` folder and `idea.md` context file.
  4. Check that UI components display the new label and icon.

---

### 2. File Naming Convention: Stage Prefix in Slugs (✅ Completed & tested)
**Status:** Implemented. Tests passing: `src/test/stage_prefix_filenames.test.ts`.
**Goal:** Prefix task filenames with their current stage to ensure unique sorting and clearer organization.
**Rationale:** Helps in organizing files on disk and allows for automatic renaming when tasks move between stages.
**Changes:**
- **State:**
  - **Current:** `task-[title].md` (e.g., `task-unit_test.md`). Drag/drop keeps filename.
  - **New:** `[stage]-[title].md` (e.g., `queue-unit_test.md`).
- **Files to Edit:**
  - `src/extension.ts`:
      - `createTaskFile`: Prefix with stage.
      - `handleMoveTask`: Rename file on move.
      - `handleSaveTaskFile`: Rename if stage changes in frontmatter.
      - `handleDuplicateTask`: Use new naming convention.
      - `parseFrontmatter`/`serializeFrontmatter`.
  - `src/components/Board.tsx`: Ensure UI handles ID/file updates.
**Implementation Details:**
- **Behavior:**
  - Task created in Queue: `queue-create_unit_test.md`
  - Moved to Code: File renamed to `code-create_unit_test.md`
- **Notes:**
  - Update `id` to match the new filename.
  - Maintain backward compatibility when reading old `task-*` files.

#### Vitest Tests
- **File:** `src/test/stage_prefix_filenames.test.ts`
- **Test Cases:**
  1. Creating a task in the Queue results in a filename starting with `queue-`.
  2. Moving a task to Code renames the file to start with `code-`.
  3. Loading legacy `task-*.md` files still works and maps to correct stage.
  4. The task `id` property matches the filename after any rename.

---

### 3. Quick Create Buttons in Topbar (Dual Placement) (✅ Completed & tested)
**Status:** Implemented. Tests passing: `src/components/__tests__/BoardQuickCreate.test.tsx`.
**Goal:** Add quick create buttons to the board topbar for easier access, while keeping them in the sidebar.
**Rationale:** Allows users to close the sidebar while still having access to create actions directly from the board.
**Changes:**
- **State:**
  - **Current:** Buttons only in `Sidebar` (`QuickCreateBar`). Board topbar has `ThemeControls`.
  - **New:** `QuickCreateBar` in both Sidebar and Board topbar.
- **UI:**
  - Add buttons: ➕ New Task, 📋 New Context, 🤖 New Agent, 📦 New Phase, 🏗️ Architecture.
- **Files to Edit:**
  - `src/components/Board.tsx`: Render `QuickCreateBar`.
  - `src/components/QuickCreateBar.tsx`: Ensure it works in both contexts.
  - `src/components/TaskModal.tsx`: Ensure availability in board.
  - `src/hooks/useContextData.ts`: Provide necessary context.
  - `src/extension.ts`: Extend board message handler for creation actions.
  - `src/index.css`: Topbar layout adjustments.
**Implementation Details:**
- Board needs context data and task modal (reuse `TaskModal` or wrapper).
- Share handlers between sidebar and topbar to avoid divergence.

#### Vitest Tests
- **File:** `src/components/__tests__/BoardQuickCreate.test.tsx`
- **Test Cases:**
  1. Verify that the quick create bar renders in the board topbar.
  2. Clicking each button opens the appropriate creation modal.
  3. Ensure the same handlers are used for sidebar and topbar actions.
  4. Snapshot test of the topbar layout after adding the bar.

---

### 4. Remove Theme/Motion Controls (✅ Completed & tested)
**Status:** Implemented. Tests passing: `tests/remove_theme_controls.test.tsx`.
**Goal:** Remove runtime theme and motion controls from the UI to simplify the interface.
**Rationale:** Users rarely switch themes at runtime; one good default is sufficient. Advanced users can still use VSCode settings.
**Changes:**
- **State:**
  - **Current:** `ThemeControls.tsx` in topbar.
  - **New:** Remove UI controls. Keep backend tokens.
- **Files to Edit:**
  - `src/components/Board.tsx`: Remove `ThemeControls`.
  - `src/components/ThemeControls.tsx`: Delete or orphan.
  - `src/index.css`: Remove topbar/theme-pill styles.
**Implementation Details:**
- Keep `ThemeProvider` logic and VSCode settings (`vibekan.theme`, `vibekan.reducedMotion`).
- Remove Dark Glass, Low Glow, and Reduced Motion buttons from the UI.

#### Vitest Tests
- **File:** `tests/remove_theme_controls.test.ts`
- **Test Cases:**
  1. Ensure `ThemeControls` component is no longer rendered in the board.
  2. Verify that theme tokens are still available via `ThemeProvider`.
  3. Confirm that no CSS classes related to theme toggles exist in the compiled CSS.

---

### 5. Multiple Contexts Per Task (✅ Completed & tested)
**Status:** Implemented. Tests passing: `tests/multiple_contexts.test.tsx`.
**Goal:** Allow attaching multiple context files to a single task instead of just one.
**Rationale:** Complex tasks often require context from multiple sources (e.g., UI design + API spec).
**Changes:**
- **State:**
  - **Current:** Single `context?: string`.
  - **New:** `contexts: string[]` (array of strings).
- **UI:**
  - Task creation/editing: Multi-select dropdown or tag-chip input.
  - Task card: Show multiple context badges.
- **Files to Edit:**
  - `src/types/task.ts`: Update interface.
  - `src/components/TaskModal.tsx`: Multi-select input.
  - `src/components/TaskCard.tsx`: Display badges.
  - `src/extension.ts`: Update frontmatter parsing/serialization.
  - `src/utils/promptBuilder.ts`: Emit multiple `<custom_context>` blocks.
**Implementation Details:**
- **Backward Compatibility:** Migrate old `context` field to `contexts: [context]`.
- **Copy-with-context:** Include ALL attached contexts in the XML prompt.

#### Vitest Tests
- **File:** `tests/multiple_contexts.test.ts`
- **Test Cases:**
  1. Creating a task with multiple contexts stores them as an array in frontmatter.
  2. Editing a task updates the `contexts` array correctly.
  3. The task card displays a badge for each context.
  4. Prompt builder generates a `<custom_context>` block for each context.

---

### 6. Full Task Metadata Editing (Not Just Content) (✅ Completed & tested)
**Status:** Implemented. Tests passing (with React act warnings to clean up): `tests/metadata_editor.test.tsx`.
**Goal:** Provide a GUI to edit all task metadata fields (title, stage, phase, agent, contexts, tags), not just the markdown content.
**Rationale:** Currently, metadata can only be edited via raw YAML frontmatter, which is error-prone and less user-friendly.
**Changes:**
- **State:**
  - **Current:** `EditorModal` only edits content.
  - **New:** Tabbed editor: "Metadata" tab (form) + "Content" tab (Monaco).
- **UI:**
  - **Metadata Tab:** Form fields for Title, Stage, Phase, Agent, Contexts, Tags.
  - **Content Tab:** Full-height Monaco editor.
- **Files to Edit:**
  - `src/components/EditorModal.tsx`: Implement tabs and form.
  - `src/extension.ts`: Update `taskFileContent` payload and save handler.
  - `src/components/Board.tsx`: Pass full task data to editor.
**Implementation Details:**
- **Behavior:** Saving updates frontmatter.
- **Side Effects:** If stage changes, trigger file rename/move (per Item 2).
- Preserve `created`, `updated`, and `order` timestamps.

#### Vitest Tests
- **File:** `tests/metadata_editor.test.ts`
- **Test Cases:**
  1. Opening the editor shows both Metadata and Content tabs.
  2. Updating metadata fields updates the frontmatter correctly.
  3. Changing the stage triggers a file rename according to the stage-prefixed naming convention.
  4. Content changes are saved without affecting metadata.

---

### 7. Editable Task Templates (Multiple Types) (✅ Completed & tested)
**Status:** Implemented. Tests passing: `tests/editable_templates.test.tsx`.
**Goal:** Allow users to create and use custom task templates.
**Rationale:** Different task types (Bug, Feature, Spike) require different structures.
**Changes:**
- **State:**
  - **Current:** Hardcoded template.
  - **New:** Load templates from `.vibekan/_templates/`.
- **UI:**
  - **Task Modal:** Template dropdown selector.
  - **Quick Create:** "📝 Templates" button to open template folder.
- **Files to Edit:**
  - `src/extension.ts`: Scaffold templates, read/render templates.
  - `src/components/TaskModal.tsx`: Template selector.
  - `src/components/QuickCreateBar.tsx`: Add Templates button.
**Implementation Details:**
- **Placeholders:** `{{title}}`, `{{stage}}`, `{{phase}}`, `{{agent}}`, `{{contexts}}`, `{{tags}}`, `{{content}}`.
- **Defaults:** Fallback to hardcoded default if folder is empty.

#### Vitest Tests
- **File:** `tests/editable_templates.test.tsx`
- **Test Cases:**
  1. Detects templates in `.vibekan/_templates/` and populates the dropdown.
  2. Selecting a template renders the appropriate placeholders in the creation modal.
  3. Creating a task with a template generates a file with the rendered content.
  4. Handles missing template folder gracefully by falling back to default.

---

### 8. Search Bar in Board Topbar (✅ Completed & tested)
**Status:** Implemented. Tests passing: `tests/search_bar.test.tsx`.
**Goal:** Add a search bar to filter tasks on the board.
**Rationale:** Essential for managing boards with many tasks.
**Changes:**
- **State:**
  - **Current:** No search.
  - **New:** Client-side filtering of tasks.
- **UI:**
  - Compact glass input in topbar.
  - Real-time filtering (debounced).
- **Files to Edit:**
  - `src/components/Board.tsx`: State, filtering logic, keyboard focus.
  - `src/index.css`: Styling.
**Implementation Details:**
- **Search Fields:** Title, tags, phase, agent, content.
- **Behavior:** Dim/hide non-matching tasks. Persist query during session.
- **Shortcut:** `/` or `Ctrl+F` to focus.

#### Vitest Tests
- **File:** `tests/search_bar.test.ts`
- **Test Cases:**
  1. Search input appears in the board topbar.
  2. Typing a query filters tasks based on title and tags.
  3. Debounced filtering does not trigger excessive renders.
  4. Pressing `/` focuses the search input.

---

### 9. Delete Action on Task Cards (✅ Completed & tested)
**Status:** Feature implemented (hover icon, Delete/D/Backspace shortcuts). Tests passing: `tests/delete_action.test.tsx`.
**Goal:** Allow deleting tasks directly from the board cards.
**Rationale:** Streamlines task management; currently delete is only possible via the tree view.
**Changes:**
- **State:**
  - **Current:** No delete on card.
  - **New:** Delete action available.
- **UI:**
  - Hover icon on card.
  - Context menu option.
- **Files to Edit:**
  - `src/components/TaskCard.tsx`: UI elements.
  - `src/components/Board.tsx`: Keyboard handler.
  - `src/extension.ts`: Handle `deleteTask` message.
**Implementation Details:**
- **Shortcut:** `Delete` or `D` when card is focused.
- **Post-Action:** Focus next/previous card. Show toast notification.

#### Vitest Tests
- **File:** `tests/delete_action.test.ts`
- **Test Cases:**
  1. Delete icon appears on hover.
  2. Clicking the icon triggers a confirmation dialog.
  3. Confirming deletion removes the task file and updates the UI.
  4. Keyboard `Delete` key deletes the focused task.

---

### 10. Comprehensive Keyboard Shortcuts (✅ Completed & tested)
**Status:** Feature implemented (N, Delete/D/Backspace, Shift+D, 1-6, /, ?, A). Tests passing: `tests/keyboard_shortcuts.test.tsx`.
**Goal:** Enable a full keyboard-driven workflow.
**Rationale:** Increases productivity for power users.
**Changes:**
- **State:**
  - **Current:** Basic arrow keys, Enter, E.
  - **New:** Extensive shortcut map.
- **Shortcuts:**
  - `N`: New task.
  - `Delete`/`D`: Delete task.
  - `Shift+D`: Duplicate task.
  - `1`-`6`: Move to stage.
  - `/`: Search.
  - `?`: Help overlay.
  - `A`: Archive (if in Completed).
- **Files to Edit:**
  - `src/components/Board.tsx`: Global handlers.
  - `src/components/TaskCard.tsx`: Card-specific handlers.
  - `src/components/HelpOverlay.tsx`: New component.
  - `package.json`: `Ctrl+Shift+V` keybinding.
**Implementation Details:**
- Add a help overlay to display shortcuts.
- Ensure no conflicts with VSCode defaults.

#### Vitest Tests
- **File:** `tests/keyboard_shortcuts.test.ts`
- **Test Cases:**
  1. Verify that each shortcut triggers the expected action.
  2. Ensure the help overlay displays the full shortcut list when `?` is pressed.
  3. Confirm that shortcuts are disabled when focus is inside an input field.
  4. Snapshot test of the board after invoking a shortcut.

---

### 11. Archive Completed Tasks (✅ Completed & tested)
**Status:** Feature implemented (archive stage, toggle, tree view). Archiving/unarchiving now routes through `handleMoveTask` to preserve stage-prefixed filenames. Tests passing: `tests/archive_tasks.test.tsx`.
**Goal:** Move completed tasks to an archive to keep the board clean.
**Rationale:** Prevents the "Completed" column from growing indefinitely.
**Changes:**
- **State:**
  - **Current:** No archive.
  - **New:** `archive` stage and folder.
- **UI:**
  - "Archive" action on completed cards.
  - "Show Archived" toggle in topbar.
  - Archive section in Tree View.
- **Files to Edit:**
  - `src/types/task.ts`: Add `archive` stage. ✅
  - `src/extension.ts`: Scaffolding, move handlers. ✅ (now delegates to `handleMoveTask`)
  - `src/components/Board.tsx`: Toggle logic. ✅
  - `src/components/TaskTree.tsx`: Archive section. ✅
  - `src/components/Column.tsx`: Added onUnarchiveTask prop. ✅
  - `src/components/TaskCard.tsx`: Archive/Unarchive buttons. ✅
**Implementation Details:**
- **Folder:** `.vibekan/tasks/archive/`.
- **Behavior:** Archived tasks are hidden by default on the board.

#### Vitest Tests
- **File:** `tests/archive_tasks.test.tsx`
- **Test Cases:**
  1. Archiving a completed task moves the file to the `archive` folder and updates its stage.
  2. The "Show Archived" toggle reveals archived tasks on the board.
  3. Archived tasks are excluded from the default board view.
  4. Unarchiving moves the task back to the `completed` stage and folder.

---

## Implementation Order

### Phase 1: Core Refactoring (Items 1-4)
1.  **Rename Chat → Idea** (Low risk, foundation).
2.  **Remove Theme/Motion Controls** (Cleanup).
3.  **Stage-Prefixed Filenames** (Foundation for file ops).
4.  **Quick Create in Topbar** (UI layout).

### Phase 2: Enhanced Features (Items 5-7)
5.  **Multiple Contexts** (Schema change).
6.  **Editable Templates** (High value).
7.  **Metadata Editor (Tabbed)** (Complex UI).

### Phase 3: Power User Features (Items 8-11)
8.  **Search Bar** (Critical usability).
9.  **Delete Action** (Workflow completeness).
10. **Keyboard Shortcuts** (Productivity).
11. **Archive System** (Long-term maintenance).

---

## Summary
**Total Items:** 11 (all implemented & tested).
**Estimated Effort:** 6-8 prompts.
**Status:** Implementation complete. Note: React act warnings still emit in metadata editor tests; underlying behavior passes assertions.
