# Files To Refactor - Vibekan Codebase

## Priority 1: Critical Monoliths

### 1. src/components/Board.tsx (897 lines) 🚨 URGENT
**Current state:** Massive React component handling all board logic
**Issues:**
- State management complexity
- Drag-and-drop logic
- Keyboard navigation
- Search/filtering
- Archive toggle
- Multiple UI concerns mixed together

**Refactor opportunities:**
- Extract custom hooks (useDragDrop, useKeyboardNav, useSearch, useArchive)
- Split into sub-components (BoardHeader, SearchBar, ColumnContainer)
- Move business logic to services
- Separate keyboard shortcuts into a dedicated handler

---

## Priority 2: Large Services

### 2. src/services/taskFileService.ts (393 lines)
**Current state:** File I/O and task persistence logic
**Refactor opportunities:**
- Split into smaller focused services (read, write, conflict detection)
- Extract validation logic
- Separate file system operations from business logic

### 3. src/webview/messageRouter.ts (322 lines)
**Current state:** Central message routing for webview communication
**Refactor opportunities:**
- Split by message type (task messages, context messages, UI messages)
- Extract handler functions into separate files
- Create typed message handlers

### 4. src/components/TaskModal.tsx (309 lines)
**Current state:** Task creation modal with template preview
**Refactor opportunities:**
- Extract form logic into custom hook
- Split template preview into separate component
- Move validation logic to service

### 5. src/services/taskService.ts (302 lines)
**Current state:** Core task operations (create, load, duplicate)
**Refactor opportunities:**
- Split into task-create, task-load, task-duplicate services
- Extract parsing logic
- Separate file operations from task logic

### 6. src/services/taskMoveService.ts (254 lines)
**Current state:** Task movement and reordering logic
**Refactor opportunities:**
- Split move logic from reorder logic
- Extract unique ID generation
- Separate cross-device file operations

---

## Priority 3: Medium-sized Components

### 7. src/utils/promptBuilder.ts (234 lines)
**Current state:** XML prompt assembly for copy-with-context
**Refactor opportunities:**
- Split into smaller builders (context builder, task builder, XML formatter)
- Extract template logic
- Separate data gathering from formatting

### 8. src/components/TaskCard.tsx (227 lines)
**Current state:** Individual task card with drag-and-drop
**Refactor opportunities:**
- Extract card actions into separate component
- Split drag logic into custom hook
- Move badge rendering to separate components

### 9. src/components/Sidebar.tsx (222 lines)
**Current state:** Sidebar view with quick-create and task tree
**Refactor opportunities:**
- Split into SidebarHeader and SidebarContent
- Extract action handlers
- Move tree logic to TaskTree component

---

## Refactoring Principles

1. **Single Responsibility:** Each file should have one clear purpose
2. **Target Size:** Aim for 150-200 lines max per file
3. **Custom Hooks:** Extract React state/effect logic into reusable hooks
4. **Service Layer:** Business logic should live in services, not components
5. **Sub-components:** Large components should be composed of smaller ones
6. **Type Safety:** Maintain strong typing throughout refactoring
7. **Test Coverage:** Ensure tests exist or are added for extracted modules

---

## Suggested Refactoring Order

1. **Board.tsx** - Biggest impact, enables other refactors
2. **taskFileService.ts** - Core infrastructure
3. **messageRouter.ts** - Communication layer
4. **TaskModal.tsx** - User-facing feature
5. **taskService.ts** - Core operations
6. **taskMoveService.ts** - Related to taskService
7. **promptBuilder.ts** - Independent utility
8. **TaskCard.tsx** - Board sub-component
9. **Sidebar.tsx** - Independent view

---

## Total Lines to Refactor
- **Priority 1:** 897 lines (Board.tsx)
- **Priority 2:** 1,860 lines (5 files)
- **Priority 3:** 683 lines (3 files)
- **Grand Total:** 3,440 lines across 9 files

## Target Outcome
Break these 9 files into ~25-30 smaller, focused modules averaging 120-150 lines each.
