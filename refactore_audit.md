# Refactoring Audit – Vibekan modularization

## Observed work
- Added new folders (`src/core`, `src/workspace`, `src/services`, `src/settings`, `src/commands`, `src/webview`) and barrel files to begin splitting responsibilities out of `src/extension.ts`.
- Extracted stage/frontmatter helpers to `src/core/*` and workspace helpers to `src/workspace/*` (scaffolding, validation, legacy migration).
- Introduced services for file I/O and context/task loading plus copy/theme setting readers; added `src/webview/contentProvider.ts` for CSP-safe HTML generation and command wrappers in `src/commands/fileCommands.ts`.
- Kept existing `TEST_API` surface and added a new gray‑matter regression test (`src/test/frontmatter_gray_matter.test.ts`) for multi-line YAML and metadata updates.

## Alignment against the requested plan
- The target outcome was a ~120 line entrypoint that delegates to modular layers. The new structure is present, but `src/extension.ts` remains the monolith at 1,532 lines and still contains all webview wiring, message routing, task CRUD, file save/move logic, prompt copy logic, and TEST_API implementations rather than delegating.
- Planned modules are missing: no `viewManager.ts`, `messageRouter.ts`, `taskFileService.ts`, `promptService.ts`, or command registration wrapper; webview message switches are duplicated for board and sidebar rather than centralized.
- Layering rules were to prevent upward imports. `src/workspace/migration.ts` imports `../services/fileSystem` (line 4), creating a workspace → services dependency and a potential cycle with `src/services/taskService.ts` importing workspace.
- TEST_API was meant to re-export service functions, but it still binds to the in-file implementations (`src/extension.ts:107-118`), keeping tests coupled to the monolith.

## Code quality findings
- **Monolith retained**: `src/extension.ts` (line 1) still defines `VibekanSidebarProvider`, message handlers, task CRUD/move/reorder, conflict detection, and copy prompt logic. This defeats the goal of isolating concerns and will keep compile times and cognitive load high.
- **Duplicate message handling**: Two long `onDidReceiveMessage` switches (board and sidebar) in `src/extension.ts:37-206` and `src/extension.ts:276-378` have near-identical cases. Future changes will need to be updated twice and risk divergence.
- **Layering violation**: Workspace migration depends on services (`src/workspace/migration.ts:1-4`), while services depend on workspace (`src/services/taskService.ts:3-5`), reintroducing circular risk the plan intended to avoid.
- **Unused/leftover imports**: `src/extension.ts` imports `fs` and `createTemplateFile` but does not use them, indicating incomplete extraction and adding bundle weight.
- **Untested new modules**: Only the new gray-matter test was added. Core/workspace/services modules lack direct unit coverage (e.g., `normalizeStage`, `validateVibekanPath`, `ensureUniqueTaskId`), so regressions could hide behind the still-monolithic integration tests.

## Improvement suggestions
1. Finish the planned extraction: move task file read/save/conflict logic, task movement/reorder, prompt copying, and TEST_API exports into dedicated services; leave `src/extension.ts` to activation/deactivation and command registration only.
2. Introduce the missing webview infrastructure (`viewManager`, `messageRouter`, `sidebarProvider` class file) to eliminate the duplicated switches and provide a single broadcast surface.
3. Fix dependency direction: relocate `readTextIfExists`/`ensureDirectory` helpers into workspace or a shared lower layer so `workspace/*` does not import from services; enforce with an import-cycle lint rule.
4. Clean imports and barrels after the move (remove unused `fs`/`createTemplateFile`, ensure barrels only re-export used surfaces) to keep bundle size and tree-shaking clean.
5. Add targeted unit tests for the new modules (stage inference, path validation, legacy migration rename logic, unique ID generation) to validate behavior independent of the extension harness.
6. Update documentation/README to describe the new layout and layering rules once the extraction is complete, so future contributors do not reintroduce cross-layer coupling.

## Testing
- Not run as part of this audit (no commands executed).
