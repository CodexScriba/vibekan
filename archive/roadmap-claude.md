# Vibe Kanban - Complete Development Roadmap

**Project:** Vibe Kanban VSCode Extension
**Created:** 2025-11-22
**Purpose:** File-based Kanban board for multi-agent LLM development workflows
**Development Approach:** Multi-agent orchestrator (solo development with AI agents)

---

## 🎯 Vision & Success Criteria

### The Core Problem
Developers using multiple AI agents spend 2-3 minutes assembling context before every handoff:
- Copy task content
- Copy architecture.md
- Copy phase context
- Copy stage context
- Paste into AI chat

**Solution:** One-click "Copy with Context" + Visual Kanban board for file-based task management.

### Success Metrics
- ✅ Task creation: <30 seconds (vs 3-5 minutes manually)
- ✅ Copy with context: <10 seconds (vs 2-3 minutes manually)
- ✅ Move task between stages: <10 seconds (vs manual file operations)
- ✅ Daily time savings: 30-60 minutes
- ✅ Zero data loss (user content never modified)
- ✅ Git-friendly (clean diffs, versionable markdown)

### Design Philosophy
- **UI-First:** Glassmorphism/liquid glass aesthetic, dark mode
- **File-Based:** Pure markdown files with YAML frontmatter
- **Zero Friction:** No onboarding, instant productivity
- **Keyboard-Driven:** Command palette + shortcuts for everything
- **Fail Explicitly:** Show errors, don't silently degrade

---

## 📁 File Structure

```
.vibekan/
├── chat/                 # AI brainstorming conversations
├── queue/                # Tasks ready to work on
├── plan/                 # Planning documents
├── code/                 # Tasks being coded
├── audit/                # Tasks being reviewed
├── completed/            # Finished tasks
└── _context/
    ├── stages/           # Stage-specific guidance
    │   ├── chat.md
    │   ├── queue.md
    │   ├── plan.md
    │   ├── code.md
    │   ├── audit.md
    │   └── completed.md
    ├── phases/           # Phase-specific context (tags)
    │   └── navbar-phase1-ui.md
    ├── agents/           # Agent system prompts
    │   ├── planner.md
    │   ├── coder.md
    │   └── pcoder.md     # Python coder agent
    └── architecture.md   # Single source of truth
```

**File Naming Convention:**
`{stage}.{feature}.{phase}.task{N}.md`

Example: `code.navbar.phase1.task3.md`

---

## 📋 Task File Structure

```markdown
---
id: task-123
title: Implement navbar component
stage: code
type: task
phase: navbar-phase1-ui
agent: coder
contexts: [api-design, db-schema]
tags: [frontend, react]
created: 2025-11-22T08:00:00Z
updated: 2025-11-22T10:30:00Z
---

<!-- MANAGED SECTION - Auto-injected context -->
## 🎯 Stage: Code
[Stage context from _context/stages/code.md...]

## 📦 Phase: Navbar Phase 1 - UI/UX
[Phase context from _context/phases/navbar-phase1-ui.md...]

## 🤖 Agent: Coder
[Agent context from _context/agents/coder.md...]

## 📚 Architecture
[Global context from _context/architecture.md...]

<!-- USER CONTENT - User writes here -->
# Implementation Notes

Build responsive navbar with mobile hamburger menu.
Use Tailwind for styling...
```

**Key Principle:** Everything above `<!-- USER CONTENT -->` is auto-managed. User only edits below.

---

## 🗺️ Development Phases

### Phase 0: Foundation (Setup & Architecture)
**Goal:** Project scaffolding, data models, file system foundation

### Phase 1: File Operations Engine
**Goal:** CRUD operations, frontmatter parsing, context injection algorithm

### Phase 2: Workspace Management
**Goal:** Create/existing workspace flow, settings, folder structure initialization

### Phase 3: Copy with Context (MVP Killer Feature)
**Goal:** Context assembly engine with clipboard integration

### Phase 4: Webview Kanban Board
**Goal:** Visual board with glassmorphism UI, drag-and-drop

### Phase 5: Stage Transitions & File Watching
**Goal:** Move tasks between stages, live updates from external changes

### Phase 6: Keyboard Shortcuts & Polish
**Goal:** Command palette, keybindings, performance optimization

### Phase 7: Tree View (Optional)
**Goal:** Sidebar navigation as alternative to board

---

## 📦 Phase 0: Foundation

### Objective
Set up VSCode extension project with TypeScript, establish core data models, and define technical architecture.

### Tasks

#### 0.1 Project Scaffolding
- [ ] Initialize VSCode extension with TypeScript template
- [ ] Set up build tooling (webpack/esbuild)
- [ ] Configure tsconfig.json for strict mode
- [ ] Add dependencies:
  - `gray-matter` (YAML frontmatter parsing)
  - `chokidar` (file watching)
  - `date-fns` (timestamp handling)
- [ ] Create folder structure: `src/`, `src/models/`, `src/services/`, `src/webview/`
- [ ] Set up ESLint and Prettier
- [ ] Initialize Git repository

#### 0.2 Data Models (TypeScript Interfaces)
Define core types in `src/models/`:

**`Task.ts`**
```typescript
interface Task {
  // Frontmatter fields
  id: string;                    // Unique identifier (UUID)
  title: string;                 // Task title
  stage: Stage;                  // Current stage
  type: 'task' | 'chat' | 'plan'; // Task type
  phase?: string;                // Phase tag (optional)
  agent?: string;                // Agent name (optional)
  contexts?: string[];           // Additional context files
  tags?: string[];               // User-defined tags
  created: Date;                 // Creation timestamp
  updated: Date;                 // Last update timestamp

  // Derived fields
  filePath: string;              // Absolute file path
  fileName: string;              // File name with extension
  managedContent: string;        // Auto-injected context
  userContent: string;           // User-editable content
}

type Stage = 'chat' | 'queue' | 'plan' | 'code' | 'audit' | 'completed';
```

**`Context.ts`**
```typescript
interface ContextFile {
  type: 'stage' | 'phase' | 'agent' | 'architecture';
  name: string;                  // e.g., 'code', 'navbar-phase1-ui', 'coder'
  filePath: string;              // Path to .md file
  content: string;               // Markdown content
}
```

**`Workspace.ts`**
```typescript
interface VibekanWorkspace {
  rootPath: string;              // Workspace root
  vibekanPath: string;           // .vibekan folder path
  contextPath: string;           // _context folder path
  initialized: boolean;          // Is workspace set up?
}
```

#### 0.3 File System Utilities
Create `src/services/fileSystem.ts`:

```typescript
class FileSystemService {
  // Read file with error handling
  async readFile(path: string): Promise<string>

  // Write file safely (atomic write)
  async writeFile(path: string, content: string): Promise<void>

  // Ensure directory exists
  async ensureDir(path: string): Promise<void>

  // List files in directory
  async listFiles(dir: string, pattern?: RegExp): Promise<string[]>

  // Move file between directories
  async moveFile(from: string, to: string): Promise<void>

  // Delete file
  async deleteFile(path: string): Promise<void>

  // Check if file exists
  async exists(path: string): Promise<boolean>
}
```

#### 0.4 YAML Frontmatter Parser
Create `src/services/frontmatterParser.ts`:

```typescript
class FrontmatterParser {
  // Parse markdown file into frontmatter + content
  parse(fileContent: string): {
    frontmatter: Record<string, any>;
    managedContent: string;
    userContent: string;
  }

  // Serialize task back to markdown
  serialize(task: Task): string

  // Validate frontmatter schema
  validate(frontmatter: any): Task | Error

  // Extract user content (below <!-- USER CONTENT -->)
  extractUserContent(content: string): string

  // Extract managed content (above <!-- USER CONTENT -->)
  extractManagedContent(content: string): string
}
```

**Algorithm for Content Extraction:**
1. Split file at `<!-- USER CONTENT -->` delimiter
2. Everything before = managed section (auto-generated)
3. Everything after = user section (never modified)
4. If delimiter missing, treat entire content as user content

#### 0.5 Unit Tests
Create `src/test/`:
- [ ] Test frontmatter parsing (valid, invalid, missing fields)
- [ ] Test file system operations (read, write, move, delete)
- [ ] Test data model validation
- [ ] Test YAML serialization edge cases (undefined values, special characters)

### Success Criteria
- ✅ Extension activates in VSCode without errors
- ✅ All data models defined with strict TypeScript types
- ✅ Frontmatter parser handles valid/invalid YAML correctly
- ✅ File system service handles common edge cases (missing files, permissions)
- ✅ Unit tests pass with >80% coverage
- ✅ Build completes without warnings

### Dependencies
None (foundation phase)

### Risks & Mitigations
- **Risk:** YAML parsing fails on special characters
  **Mitigation:** Use `gray-matter` library (battle-tested), add validation layer

- **Risk:** File operations fail on Windows paths
  **Mitigation:** Use `path.posix` for consistent cross-platform paths

---

## 📦 Phase 1: File Operations Engine

### Objective
Implement CRUD operations for tasks, context injection algorithm, and file-based state management.

### Tasks

#### 1.1 Task Repository Service
Create `src/services/taskRepository.ts`:

```typescript
class TaskRepository {
  constructor(private workspace: VibekanWorkspace) {}

  // Load all tasks from .vibekan folder
  async loadAll(): Promise<Task[]>

  // Load tasks by stage
  async loadByStage(stage: Stage): Promise<Task[]>

  // Load single task by ID
  async loadById(id: string): Promise<Task | null>

  // Create new task
  async create(task: Partial<Task>): Promise<Task>

  // Update existing task
  async update(taskId: string, updates: Partial<Task>): Promise<Task>

  // Delete task
  async delete(taskId: string): Promise<void>

  // Move task to different stage
  async moveToStage(taskId: string, newStage: Stage): Promise<Task>
}
```

**Implementation Details:**
- `loadAll()`: Scan all stage folders, parse frontmatter, return Task objects
- `create()`: Generate UUID, set timestamps, inject context, write file
- `update()`: Read existing file, preserve user content, update frontmatter, write back
- `moveToStage()`: Move file to new folder, update stage context, preserve user content

#### 1.2 Context Injection Engine
Create `src/services/contextInjector.ts`:

```typescript
class ContextInjector {
  constructor(private workspace: VibekanWorkspace) {}

  // Inject all relevant context into task
  async injectContext(task: Task): Promise<string>

  // Load stage context
  private async loadStageContext(stage: Stage): Promise<string>

  // Load phase context (if task.phase is set)
  private async loadPhaseContext(phase?: string): Promise<string>

  // Load agent context (if task.agent is set)
  private async loadAgentContext(agent?: string): Promise<string>

  // Load architecture.md (always included)
  private async loadArchitecture(): Promise<string>

  // Assemble managed section
  private assembleManagedSection(contexts: {
    stage: string;
    phase?: string;
    agent?: string;
    architecture: string;
  }): string
}
```

**Context Injection Algorithm:**
```typescript
async injectContext(task: Task): Promise<string> {
  const sections: string[] = [];

  // 1. Stage context (always included)
  const stageContext = await this.loadStageContext(task.stage);
  sections.push(`## 🎯 Stage: ${task.stage}\n${stageContext}`);

  // 2. Phase context (if specified)
  if (task.phase) {
    const phaseContext = await this.loadPhaseContext(task.phase);
    if (phaseContext) {
      sections.push(`## 📦 Phase: ${task.phase}\n${phaseContext}`);
    }
  }

  // 3. Agent context (if specified)
  if (task.agent) {
    const agentContext = await this.loadAgentContext(task.agent);
    if (agentContext) {
      sections.push(`## 🤖 Agent: ${task.agent}\n${agentContext}`);
    }
  }

  // 4. Architecture (always included)
  const architecture = await this.loadArchitecture();
  sections.push(`## 📚 Architecture\n${architecture}`);

  // 5. Assemble
  return [
    '<!-- MANAGED SECTION - Auto-injected context -->',
    ...sections,
    '',
    '<!-- USER CONTENT - User writes here -->'
  ].join('\n\n');
}
```

**File Loading Logic:**
- Stage: `_context/stages/{stage}.md`
- Phase: `_context/phases/{phase}.md`
- Agent: `_context/agents/{agent}.md`
- Architecture: `_context/architecture.md`
- If file doesn't exist, skip that section (graceful degradation)

#### 1.3 Task File Writer
Create `src/services/taskWriter.ts`:

```typescript
class TaskWriter {
  constructor(
    private parser: FrontmatterParser,
    private injector: ContextInjector,
    private fs: FileSystemService
  ) {}

  // Write task to disk
  async write(task: Task, preserveUserContent: boolean = true): Promise<void> {
    // 1. Load existing file (if updating)
    let userContent = '';
    if (preserveUserContent && await this.fs.exists(task.filePath)) {
      const existing = await this.fs.readFile(task.filePath);
      const parsed = this.parser.parse(existing);
      userContent = parsed.userContent;
    }

    // 2. Inject context (managed section)
    const managedContent = await this.injector.injectContext(task);

    // 3. Serialize frontmatter
    const frontmatter = this.serializeFrontmatter(task);

    // 4. Assemble full file
    const fileContent = [
      '---',
      frontmatter,
      '---',
      '',
      managedContent,
      userContent || '# Task Notes\n\nAdd your notes here...'
    ].join('\n');

    // 5. Write to disk
    await this.fs.writeFile(task.filePath, fileContent);
  }

  private serializeFrontmatter(task: Task): string {
    // Use gray-matter to serialize, ensuring no undefined values
    const data = {
      id: task.id,
      title: task.title,
      stage: task.stage,
      type: task.type,
      ...(task.phase && { phase: task.phase }),
      ...(task.agent && { agent: task.agent }),
      ...(task.contexts && task.contexts.length > 0 && { contexts: task.contexts }),
      ...(task.tags && task.tags.length > 0 && { tags: task.tags }),
      created: task.created.toISOString(),
      updated: task.updated.toISOString()
    };
    return matter.stringify('', data).split('---')[1].trim();
  }
}
```

#### 1.4 Filename Generator
Create `src/services/filenameGenerator.ts`:

```typescript
class FilenameGenerator {
  // Generate filename following convention: {stage}.{feature}.{phase}.task{N}.md
  generate(task: Task, feature: string): string {
    const parts = [task.stage];

    if (feature) parts.push(this.slugify(feature));
    if (task.phase) parts.push(this.slugify(task.phase));

    parts.push(`task${this.getNextTaskNumber(task.stage, feature, task.phase)}`);

    return parts.join('.') + '.md';
  }

  // Convert to slug (lowercase, hyphens)
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Get next available task number
  private getNextTaskNumber(stage: Stage, feature: string, phase?: string): number {
    // Scan existing files, find highest task number, increment
    // e.g., if task1, task2, task3 exist → return 4
  }
}
```

#### 1.5 WorkspaceEdit Integration
Create `src/services/documentEditor.ts`:

```typescript
class DocumentEditor {
  // Safely edit open document using VSCode WorkspaceEdit API
  async updateOpenDocument(task: Task, newFrontmatter: any): Promise<void> {
    const doc = vscode.workspace.textDocuments.find(
      d => d.uri.fsPath === task.filePath
    );

    if (!doc) {
      // File not open, safe to write directly
      return;
    }

    // File is open, use WorkspaceEdit to avoid conflicts
    const edit = new vscode.WorkspaceEdit();

    // Parse current document
    const text = doc.getText();
    const parsed = this.parser.parse(text);

    // Update only frontmatter region
    const frontmatterRange = new vscode.Range(
      doc.lineAt(0).range.start,
      doc.lineAt(this.findFrontmatterEnd(text)).range.end
    );

    const newFrontmatterText = matter.stringify('', newFrontmatter);
    edit.replace(doc.uri, frontmatterRange, newFrontmatterText);

    await vscode.workspace.applyEdit(edit);
  }
}
```

#### 1.6 Unit Tests
- [ ] Test task creation with all fields
- [ ] Test task update preserves user content
- [ ] Test context injection with various combinations
- [ ] Test file move between stages
- [ ] Test filename generation edge cases
- [ ] Test YAML serialization doesn't introduce undefined values
- [ ] Test WorkspaceEdit integration with open documents

### Success Criteria
- ✅ Can create task with auto-generated ID, timestamps, filename
- ✅ Context injection pulls from correct files (stage, phase, agent, architecture)
- ✅ User content never modified during updates
- ✅ File moves update frontmatter and folder location
- ✅ Open documents updated via WorkspaceEdit (no conflicts)
- ✅ Graceful handling of missing context files
- ✅ All unit tests pass

### Dependencies
- Phase 0 (Foundation)

### Risks & Mitigations
- **Risk:** Context injection fails if architecture.md missing
  **Mitigation:** Create default architecture.md on workspace init

- **Risk:** Concurrent edits cause data loss
  **Mitigation:** Use WorkspaceEdit API for open documents

---

## 📦 Phase 2: Workspace Management

### Objective
Implement workspace initialization flow (create new, open existing) with settings management.

### Tasks

#### 2.1 Workspace Detector
Create `src/services/workspaceDetector.ts`:

```typescript
class WorkspaceDetector {
  // Check if current workspace has .vibekan folder
  async isVibekanWorkspace(): Promise<boolean>

  // Get workspace root path
  getWorkspaceRoot(): string | null

  // Get .vibekan folder path
  getVibekanPath(): string | null
}
```

#### 2.2 Workspace Initializer
Create `src/services/workspaceInitializer.ts`:

```typescript
class WorkspaceInitializer {
  // Create .vibekan folder structure
  async initialize(workspaceRoot: string): Promise<void> {
    const vibekanPath = path.join(workspaceRoot, '.vibekan');

    // Create stage folders
    await fs.ensureDir(path.join(vibekanPath, 'chat'));
    await fs.ensureDir(path.join(vibekanPath, 'queue'));
    await fs.ensureDir(path.join(vibekanPath, 'plan'));
    await fs.ensureDir(path.join(vibekanPath, 'code'));
    await fs.ensureDir(path.join(vibekanPath, 'audit'));
    await fs.ensureDir(path.join(vibekanPath, 'completed'));

    // Create _context structure
    const contextPath = path.join(vibekanPath, '_context');
    await fs.ensureDir(path.join(contextPath, 'stages'));
    await fs.ensureDir(path.join(contextPath, 'phases'));
    await fs.ensureDir(path.join(contextPath, 'agents'));

    // Create default context files
    await this.createDefaultStageContexts(contextPath);
    await this.createDefaultArchitecture(contextPath);
  }

  private async createDefaultStageContexts(contextPath: string): Promise<void> {
    const stages = ['chat', 'queue', 'plan', 'code', 'audit', 'completed'];

    for (const stage of stages) {
      const filePath = path.join(contextPath, 'stages', `${stage}.md`);
      const content = this.getDefaultStageContent(stage);
      await fs.writeFile(filePath, content);
    }
  }

  private async createDefaultArchitecture(contextPath: string): Promise<void> {
    const filePath = path.join(contextPath, 'architecture.md');
    const content = `# Architecture

## Project Structure

\`\`\`
project/
├── src/
├── tests/
└── docs/
\`\`\`

## Tech Stack
- Language: [Add details]
- Framework: [Add details]

## Key Decisions
- [Document your architectural decisions here]
`;
    await fs.writeFile(filePath, content);
  }
}
```

#### 2.3 Extension Activation Commands
Update `src/extension.ts`:

```typescript
export function activate(context: vscode.ExtensionContext) {
  // Command: Create New Workspace
  context.subscriptions.push(
    vscode.commands.registerCommand('vibekan.createWorkspace', async () => {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const detector = new WorkspaceDetector();
      if (await detector.isVibekanWorkspace()) {
        vscode.window.showWarningMessage('.vibekan folder already exists');
        return;
      }

      const initializer = new WorkspaceInitializer();
      await initializer.initialize(workspaceRoot);

      vscode.window.showInformationMessage('Vibe Kanban workspace created!');

      // Open Kanban board
      vscode.commands.executeCommand('vibekan.openBoard');
    })
  );

  // Command: Open Existing Workspace
  context.subscriptions.push(
    vscode.commands.registerCommand('vibekan.openWorkspace', async () => {
      const detector = new WorkspaceDetector();

      if (!await detector.isVibekanWorkspace()) {
        const create = await vscode.window.showQuickPick(
          ['Create New Workspace', 'Cancel'],
          { placeHolder: 'No .vibekan folder found. Create one?' }
        );

        if (create === 'Create New Workspace') {
          vscode.commands.executeCommand('vibekan.createWorkspace');
        }
        return;
      }

      // Open Kanban board
      vscode.commands.executeCommand('vibekan.openBoard');
    })
  );

  // Command: Open Settings
  context.subscriptions.push(
    vscode.commands.registerCommand('vibekan.openSettings', async () => {
      // Open VSCode settings filtered to vibekan.*
      vscode.commands.executeCommand('workbench.action.openSettings', 'vibekan');
    })
  );
}
```

#### 2.4 Settings Schema
Add to `package.json`:

```json
{
  "contributes": {
    "configuration": {
      "title": "Vibe Kanban",
      "properties": {
        "vibekan.defaultStage": {
          "type": "string",
          "default": "queue",
          "enum": ["chat", "queue", "plan", "code", "audit", "completed"],
          "description": "Default stage for new tasks"
        },
        "vibekan.autoUpdateSlug": {
          "type": "boolean",
          "default": true,
          "description": "Automatically update filename slug when moving tasks"
        },
        "vibekan.theme": {
          "type": "string",
          "default": "dark",
          "enum": ["dark", "light"],
          "description": "Kanban board theme (dark mode is recommended)"
        },
        "vibekan.contextCopyMode": {
          "type": "string",
          "default": "full",
          "enum": ["full", "task-only", "context-only"],
          "description": "Default context copy mode"
        }
      }
    }
  }
}
```

#### 2.5 Welcome Screen
Create simple activation flow:
1. User installs extension
2. Command palette shows: "Vibe Kanban: Create Workspace" or "Vibe Kanban: Open Workspace"
3. If create → initialize `.vibekan/`, open board
4. If open → check for `.vibekan/`, open board or prompt to create

### Success Criteria
- ✅ Can create new workspace with proper folder structure
- ✅ Default context files created with templates
- ✅ Can detect existing workspace
- ✅ Settings accessible via VSCode preferences
- ✅ Zero onboarding screens (just commands)

### Dependencies
- Phase 0 (Foundation)
- Phase 1 (File Operations)

### Risks & Mitigations
- **Risk:** User accidentally creates multiple `.vibekan/` folders
  **Mitigation:** Check for existing folder before creating

---

## 📦 Phase 3: Copy with Context (MVP Killer Feature)

### Objective
Implement the core feature: one-click context assembly and clipboard copy.

### Tasks

#### 3.1 Context Assembler Service
Create `src/services/contextAssembler.ts`:

```typescript
type CopyMode = 'full' | 'task-only' | 'context-only';

class ContextAssembler {
  constructor(
    private taskRepo: TaskRepository,
    private contextInjector: ContextInjector,
    private parser: FrontmatterParser
  ) {}

  // Assemble context for clipboard
  async assembleForCopy(taskId: string, mode: CopyMode): Promise<string> {
    const task = await this.taskRepo.loadById(taskId);
    if (!task) throw new Error('Task not found');

    const sections: string[] = [];

    switch (mode) {
      case 'full':
        sections.push(this.formatTaskHeader(task));
        sections.push(await this.getContextSection(task));
        sections.push(this.getUserContent(task));
        break;

      case 'context-only':
        sections.push(await this.getContextSection(task));
        break;

      case 'task-only':
        sections.push(this.formatTaskHeader(task));
        sections.push(this.getUserContent(task));
        break;
    }

    return sections.join('\n\n---\n\n');
  }

  private formatTaskHeader(task: Task): string {
    return `# ${task.title}

**Stage:** ${task.stage}
**Phase:** ${task.phase || 'None'}
**Agent:** ${task.agent || 'None'}
**Tags:** ${task.tags?.join(', ') || 'None'}
`;
  }

  private async getContextSection(task: Task): Promise<string> {
    return await this.contextInjector.injectContext(task);
  }

  private getUserContent(task: Task): string {
    return task.userContent || '';
  }

  // Calculate character count (for token estimation)
  getCharacterCount(content: string): number {
    return content.length;
  }
}
```

#### 3.2 Clipboard Integration
Create `src/services/clipboardService.ts`:

```typescript
class ClipboardService {
  // Copy to clipboard and show notification
  async copyToClipboard(content: string): Promise<void> {
    await vscode.env.clipboard.writeText(content);

    const charCount = content.length;
    const tokenEstimate = Math.ceil(charCount / 4); // Rough estimate

    vscode.window.showInformationMessage(
      `✓ Copied ${charCount.toLocaleString()} characters (~${tokenEstimate.toLocaleString()} tokens)`
    );
  }
}
```

#### 3.3 Command Registration
Add to `src/extension.ts`:

```typescript
// Command: Copy Task with Context
context.subscriptions.push(
  vscode.commands.registerCommand('vibekan.copyWithContext', async (taskId?: string) => {
    // If called from command palette, show quick pick
    if (!taskId) {
      const tasks = await taskRepo.loadAll();
      const selected = await vscode.window.showQuickPick(
        tasks.map(t => ({
          label: t.title,
          description: `${t.stage} | ${t.phase || 'No phase'}`,
          taskId: t.id
        })),
        { placeHolder: 'Select task to copy' }
      );

      if (!selected) return;
      taskId = selected.taskId;
    }

    // Ask for copy mode
    const modeConfig = vscode.workspace.getConfiguration('vibekan').get<CopyMode>('contextCopyMode');

    const mode = await vscode.window.showQuickPick<{label: string, mode: CopyMode}>([
      { label: '📦 Full Context (Task + All Context)', mode: 'full' },
      { label: '📄 Task Only (No Context)', mode: 'task-only' },
      { label: '🔧 Context Only (No User Content)', mode: 'context-only' }
    ], {
      placeHolder: 'Select copy mode',
      // Pre-select based on config
    });

    if (!mode) return;

    const assembler = new ContextAssembler(taskRepo, contextInjector, parser);
    const content = await assembler.assembleForCopy(taskId, mode.mode);

    const clipboard = new ClipboardService();
    await clipboard.copyToClipboard(content);
  })
);
```

#### 3.4 Keyboard Shortcut
Add to `package.json`:

```json
{
  "contributes": {
    "keybindings": [
      {
        "command": "vibekan.copyWithContext",
        "key": "ctrl+shift+c",
        "mac": "cmd+shift+c",
        "when": "vibekan.active"
      }
    ]
  }
}
```

#### 3.5 Integration Tests
- [ ] Test full context assembly includes all sections
- [ ] Test task-only mode excludes context
- [ ] Test context-only mode excludes user content
- [ ] Test character count accuracy
- [ ] Test clipboard write success
- [ ] Test notification display

### Success Criteria
- ✅ Copy with context completes in <10 seconds
- ✅ Character count displayed for token estimation
- ✅ Three copy modes work correctly
- ✅ Keyboard shortcut triggers command
- ✅ Content properly formatted for LLM consumption
- ✅ Works from command palette and keyboard

### Dependencies
- Phase 1 (File Operations)
- Phase 2 (Workspace Management)

### Risks & Mitigations
- **Risk:** Extremely large context exceeds clipboard limits
  **Mitigation:** No specific handling, just copy and show size

---

## 📦 Phase 4: Webview Kanban Board

### Objective
Build visual Kanban board with glassmorphism UI, drag-and-drop, and real-time updates.

### Tasks

#### 4.1 Webview Provider Setup
Create `src/webview/kanbanViewProvider.ts`:

```typescript
class KanbanViewProvider implements vscode.WebviewViewProvider {
  constructor(
    private extensionUri: vscode.Uri,
    private taskRepo: TaskRepository
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'loadBoard':
          await this.loadBoard(webviewView.webview);
          break;
        case 'moveTask':
          await this.moveTask(message.taskId, message.toStage);
          break;
        case 'copyTask':
          await this.copyTask(message.taskId, message.mode);
          break;
        case 'deleteTask':
          await this.deleteTask(message.taskId);
          break;
      }
    });
  }

  private async loadBoard(webview: vscode.Webview) {
    const tasks = await this.taskRepo.loadAll();

    // Group by stage
    const board = {
      chat: tasks.filter(t => t.stage === 'chat'),
      queue: tasks.filter(t => t.stage === 'queue'),
      plan: tasks.filter(t => t.stage === 'plan'),
      code: tasks.filter(t => t.stage === 'code'),
      audit: tasks.filter(t => t.stage === 'audit'),
      completed: tasks.filter(t => t.stage === 'completed')
    };

    webview.postMessage({ type: 'boardLoaded', board });
  }
}
```

#### 4.2 Frontend Stack
Create `src/webview/` with:
- React + TypeScript
- Vite for bundling
- @dnd-kit/core for drag-and-drop
- CSS with glassmorphism styles

**Build setup:**
```json
// webview/package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@dnd-kit/core": "^6.0.8",
    "@dnd-kit/sortable": "^7.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0"
  }
}
```

#### 4.3 Kanban Board Component
Create `src/webview/src/components/KanbanBoard.tsx`:

```typescript
interface BoardData {
  chat: Task[];
  queue: Task[];
  plan: Task[];
  code: Task[];
  audit: Task[];
  completed: Task[];
}

const KanbanBoard: React.FC = () => {
  const [board, setBoard] = useState<BoardData | null>(null);

  useEffect(() => {
    // Request board data from extension
    vscode.postMessage({ type: 'loadBoard' });

    // Listen for board updates
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'boardLoaded') {
        setBoard(message.board);
      }
    });
  }, []);

  if (!board) return <LoadingSpinner />;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {Object.entries(board).map(([stage, tasks]) => (
          <KanbanColumn
            key={stage}
            stage={stage as Stage}
            tasks={tasks}
          />
        ))}
      </div>
    </DndContext>
  );
};
```

#### 4.4 Kanban Column Component
Create `src/webview/src/components/KanbanColumn.tsx`:

```typescript
const KanbanColumn: React.FC<{stage: Stage, tasks: Task[]}> = ({ stage, tasks }) => {
  const { setNodeRef } = useDroppable({ id: stage });

  return (
    <div ref={setNodeRef} className="kanban-column">
      <div className="column-header">
        <h2>{stage.toUpperCase()}</h2>
        <span className="task-count">{tasks.length}</span>
      </div>

      <div className="column-content">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};
```

#### 4.5 Task Card Component
Create `src/webview/src/components/TaskCard.tsx`:

```typescript
const TaskCard: React.FC<{task: Task}> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="task-card glass"
    >
      <h3>{task.title}</h3>

      {task.phase && (
        <span className="phase-badge">{task.phase}</span>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="tags">
          {task.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="card-actions">
        <button onClick={() => copyTask(task.id)}>📋 Copy</button>
        <button onClick={() => deleteTask(task.id)}>🗑️</button>
      </div>
    </div>
  );
};
```

#### 4.6 Glassmorphism Styles
Create `src/webview/src/styles/glassmorphism.css`:

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  --glass-blur: 10px;
}

.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}

.task-card {
  padding: 16px;
  margin-bottom: 12px;
  cursor: grab;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.5);
}

.task-card:active {
  cursor: grabbing;
}

.kanban-column {
  min-width: 280px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--glass-border);
}

.task-count {
  background: var(--glass-bg);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
}

/* Dark mode colors */
body {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e4e4e4;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
```

#### 4.7 Drag and Drop Handler
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over) return;

  const taskId = active.id as string;
  const toStage = over.id as Stage;

  // Send message to extension to move task
  vscode.postMessage({
    type: 'moveTask',
    taskId,
    toStage
  });
};
```

#### 4.8 Webview HTML Template
Create `src/webview/getHtmlForWebview.ts`:

```typescript
function getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'index.js')
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'index.css')
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>Vibe Kanban</title>
</head>
<body>
  <div id="root"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
}
```

### Success Criteria
- ✅ Board displays all 6 columns (chat, queue, plan, code, audit, completed)
- ✅ Tasks render as cards with title, phase badge, tags
- ✅ Drag-and-drop between columns works smoothly
- ✅ Glassmorphism aesthetic matches design vision
- ✅ Dark mode by default
- ✅ Column badges show task counts
- ✅ Copy button triggers context copy
- ✅ Board loads in <2 seconds

### Dependencies
- Phase 1 (File Operations)
- Phase 2 (Workspace Management)
- Phase 3 (Copy with Context)

### Risks & Mitigations
- **Risk:** Webview CSP blocks styles/scripts
  **Mitigation:** Configure proper webview options with localResourceRoots

- **Risk:** Drag-and-drop laggy with many tasks
  **Mitigation:** Use virtualization if >50 tasks per column

---

## 📦 Phase 5: Stage Transitions & File Watching

### Objective
Implement task movement between stages with file watching for external changes.

### Tasks

#### 5.1 Task Mover Service
Create `src/services/taskMover.ts`:

```typescript
class TaskMover {
  constructor(
    private taskRepo: TaskRepository,
    private taskWriter: TaskWriter,
    private fs: FileSystemService,
    private contextInjector: ContextInjector
  ) {}

  // Move task to new stage
  async moveToStage(taskId: string, newStage: Stage): Promise<Task> {
    const task = await this.taskRepo.loadById(taskId);
    if (!task) throw new Error('Task not found');

    // 1. Update frontmatter
    const oldStage = task.stage;
    task.stage = newStage;
    task.updated = new Date();

    // 2. Determine new file path
    const oldPath = task.filePath;
    const newFileName = this.getFileName(oldPath, newStage);
    const newPath = path.join(
      this.getWorkspacePath(),
      '.vibekan',
      newStage,
      newFileName
    );

    task.filePath = newPath;
    task.fileName = newFileName;

    // 3. Re-inject context (new stage context)
    await this.taskWriter.write(task, true); // Preserve user content

    // 4. Delete old file
    await this.fs.deleteFile(oldPath);

    return task;
  }

  private getFileName(oldPath: string, newStage: Stage): string {
    const config = vscode.workspace.getConfiguration('vibekan');
    const autoUpdateSlug = config.get<boolean>('autoUpdateSlug', true);

    if (!autoUpdateSlug) {
      return path.basename(oldPath);
    }

    // Update slug: code.navbar.task3.md → queue.navbar.task3.md
    const oldName = path.basename(oldPath, '.md');
    const parts = oldName.split('.');
    parts[0] = newStage; // Replace stage prefix
    return parts.join('.') + '.md';
  }
}
```

#### 5.2 File Watcher Setup
Create `src/services/fileWatcher.ts`:

```typescript
class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private changeCallbacks: Array<(filePath: string) => void> = [];

  // Start watching .vibekan folder
  start(vibekanPath: string): void {
    this.watcher = chokidar.watch(vibekanPath, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true
    });

    this.watcher
      .on('add', (path) => this.notifyChange(path))
      .on('change', (path) => this.notifyChange(path))
      .on('unlink', (path) => this.notifyChange(path));
  }

  // Register callback for file changes
  onChange(callback: (filePath: string) => void): void {
    this.changeCallbacks.push(callback);
  }

  private notifyChange(filePath: string): void {
    this.changeCallbacks.forEach(cb => cb(filePath));
  }

  // Stop watching
  stop(): void {
    this.watcher?.close();
  }
}
```

#### 5.3 Board Auto-Refresh
Update `src/webview/kanbanViewProvider.ts`:

```typescript
class KanbanViewProvider {
  private fileWatcher: FileWatcher;

  constructor() {
    this.fileWatcher = new FileWatcher();

    // Reload board when files change
    this.fileWatcher.onChange(async (filePath) => {
      // Debounce to avoid excessive reloads
      clearTimeout(this.reloadTimeout);
      this.reloadTimeout = setTimeout(() => {
        this.loadBoard(this.currentWebview);
      }, 500);
    });
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    // Start watching
    const vibekanPath = path.join(this.workspaceRoot, '.vibekan');
    this.fileWatcher.start(vibekanPath);

    // ... rest of setup
  }
}
```

#### 5.4 Move Task Handler
Add to webview provider:

```typescript
private async moveTask(taskId: string, toStage: Stage): Promise<void> {
  try {
    const mover = new TaskMover(taskRepo, taskWriter, fs, contextInjector);
    await mover.moveToStage(taskId, toStage);

    // Reload board
    await this.loadBoard(this.currentWebview);

    vscode.window.showInformationMessage(`Task moved to ${toStage}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to move task: ${error.message}`);
  }
}
```

#### 5.5 Integration Tests
- [ ] Test move task updates file location
- [ ] Test move task updates frontmatter stage
- [ ] Test move task re-injects stage context
- [ ] Test move task preserves user content
- [ ] Test file watcher detects external changes
- [ ] Test board auto-refreshes on file change
- [ ] Test slug update setting respected

### Success Criteria
- ✅ Drag-and-drop moves task file to new folder
- ✅ Stage context re-injected on move
- ✅ User content preserved 100%
- ✅ File watcher detects external edits
- ✅ Board auto-refreshes within 1 second of change
- ✅ Slug update setting works
- ✅ Move completes in <10 seconds

### Dependencies
- Phase 1 (File Operations)
- Phase 4 (Webview Kanban Board)

### Risks & Mitigations
- **Risk:** File watcher triggers infinite loop (move → watch → reload → move)
  **Mitigation:** Debounce reload, ignore self-triggered changes

---

## 📦 Phase 6: Keyboard Shortcuts & Polish

### Objective
Add keyboard shortcuts, command palette integration, and UI polish.

### Tasks

#### 6.1 Keyboard Shortcuts
Add to `package.json`:

```json
{
  "contributes": {
    "keybindings": [
      {
        "command": "vibekan.quickAddTask",
        "key": "ctrl+n",
        "mac": "cmd+n",
        "when": "vibekan.active"
      },
      {
        "command": "vibekan.copyWithContext",
        "key": "ctrl+shift+c",
        "mac": "cmd+shift+c",
        "when": "vibekan.active"
      },
      {
        "command": "vibekan.openBoard",
        "key": "ctrl+shift+k",
        "mac": "cmd+shift+k"
      },
      {
        "command": "vibekan.focusSearch",
        "key": "ctrl+f",
        "mac": "cmd+f",
        "when": "vibekan.boardVisible"
      }
    ]
  }
}
```

#### 6.2 Quick Add Task
Create `src/commands/quickAddTask.ts`:

```typescript
async function quickAddTask(): Promise<void> {
  // 1. Title input
  const title = await vscode.window.showInputBox({
    prompt: 'Task title',
    placeHolder: 'e.g., Implement navbar component'
  });

  if (!title) return;

  // 2. Stage selection
  const stage = await vscode.window.showQuickPick<{label: string, stage: Stage}>([
    { label: '💬 Chat', stage: 'chat' },
    { label: '📋 Queue', stage: 'queue' },
    { label: '📝 Plan', stage: 'plan' },
    { label: '⚙️ Code', stage: 'code' },
    { label: '🔍 Audit', stage: 'audit' },
    { label: '✅ Completed', stage: 'completed' }
  ], {
    placeHolder: 'Select stage'
  });

  if (!stage) return;

  // 3. Phase (optional)
  const phases = await loadPhases(); // Scan _context/phases/
  const phase = await vscode.window.showQuickPick(
    [{ label: '(No phase)', value: null }, ...phases.map(p => ({ label: p, value: p }))],
    { placeHolder: 'Select phase (optional)' }
  );

  // 4. Agent (optional)
  const agents = await loadAgents(); // Scan _context/agents/
  const agent = await vscode.window.showQuickPick(
    [{ label: '(No agent)', value: null }, ...agents.map(a => ({ label: a, value: a }))],
    { placeHolder: 'Select agent (optional)' }
  );

  // 5. Tags (optional)
  const tagsInput = await vscode.window.showInputBox({
    prompt: 'Tags (comma-separated, optional)',
    placeHolder: 'e.g., frontend, react, ui'
  });

  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

  // 6. Create task
  const task: Partial<Task> = {
    title,
    stage: stage.stage,
    type: 'task',
    phase: phase?.value || undefined,
    agent: agent?.value || undefined,
    tags: tags.length > 0 ? tags : undefined
  };

  await taskRepo.create(task);

  vscode.window.showInformationMessage(`✓ Task "${title}" created in ${stage.stage}`);

  // Refresh board
  vscode.commands.executeCommand('vibekan.refreshBoard');
}
```

#### 6.3 Search/Filter
Add search box to webview:

```typescript
const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Filter board by title/tags/phase
  };

  return (
    <div className="search-bar glass">
      <input
        type="text"
        placeholder="Search tasks..."
        value={query}
        onChange={handleSearch}
      />
    </div>
  );
};
```

#### 6.4 Loading States
Add loading spinners and skeletons:

```typescript
const LoadingSpinner: React.FC = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Loading board...</p>
  </div>
);

const TaskCardSkeleton: React.FC = () => (
  <div className="task-card skeleton">
    <div className="skeleton-title"></div>
    <div className="skeleton-badge"></div>
  </div>
);
```

#### 6.5 Error Handling UI
```typescript
const ErrorMessage: React.FC<{error: string}> = ({ error }) => (
  <div className="error-message glass">
    <span className="error-icon">⚠️</span>
    <p>{error}</p>
  </div>
);
```

#### 6.6 Command Palette Integration
Add all commands to `package.json`:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "vibekan.createWorkspace",
        "title": "Vibe Kanban: Create Workspace"
      },
      {
        "command": "vibekan.openWorkspace",
        "title": "Vibe Kanban: Open Workspace"
      },
      {
        "command": "vibekan.openBoard",
        "title": "Vibe Kanban: Open Board"
      },
      {
        "command": "vibekan.quickAddTask",
        "title": "Vibe Kanban: Quick Add Task"
      },
      {
        "command": "vibekan.copyWithContext",
        "title": "Vibe Kanban: Copy Task with Context"
      },
      {
        "command": "vibekan.openSettings",
        "title": "Vibe Kanban: Open Settings"
      },
      {
        "command": "vibekan.refreshBoard",
        "title": "Vibe Kanban: Refresh Board"
      }
    ]
  }
}
```

#### 6.7 Performance Optimization
- [ ] Memoize task cards to prevent unnecessary re-renders
- [ ] Lazy load context files (only when copying)
- [ ] Debounce file watcher updates
- [ ] Virtualize columns if >50 tasks

### Success Criteria
- ✅ All keyboard shortcuts work
- ✅ Quick add task completes in <30 seconds
- ✅ Search filters tasks in real-time
- ✅ Loading states shown during async operations
- ✅ Errors displayed clearly
- ✅ Command palette shows all commands
- ✅ Board feels fast and responsive

### Dependencies
- Phase 1-5 (All previous phases)

### Risks & Mitigations
- **Risk:** Too many keyboard shortcuts conflict with VSCode
  **Mitigation:** Use `vibekan.active` context for scoped shortcuts

---

## 📦 Phase 7: Tree View (Optional)

### Objective
Add sidebar tree view as alternative navigation to board.

### Tasks

#### 7.1 Tree Data Provider
Create `src/treeView/taskTreeProvider.ts`:

```typescript
class TaskTreeProvider implements vscode.TreeDataProvider<TaskTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TaskTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private taskRepo: TaskRepository) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TaskTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]> {
    if (!element) {
      // Root level: show stages
      return [
        new StageTreeItem('chat', this.taskRepo),
        new StageTreeItem('queue', this.taskRepo),
        new StageTreeItem('plan', this.taskRepo),
        new StageTreeItem('code', this.taskRepo),
        new StageTreeItem('audit', this.taskRepo),
        new StageTreeItem('completed', this.taskRepo)
      ];
    }

    if (element instanceof StageTreeItem) {
      // Stage level: show tasks
      const tasks = await this.taskRepo.loadByStage(element.stage);
      return tasks.map(t => new TaskTreeItem(t));
    }

    return [];
  }
}

class TaskTreeItem extends vscode.TreeItem {
  constructor(public task: Task) {
    super(task.title, vscode.TreeItemCollapsibleState.None);

    this.description = task.phase || '';
    this.tooltip = `${task.stage} | ${task.phase || 'No phase'}`;
    this.contextValue = 'task';

    this.command = {
      command: 'vibekan.openTaskFile',
      title: 'Open Task',
      arguments: [task]
    };
  }
}
```

#### 7.2 Register Tree View
Add to `src/extension.ts`:

```typescript
const treeProvider = new TaskTreeProvider(taskRepo);
vscode.window.registerTreeDataProvider('vibekanTasks', treeProvider);

// Refresh on file changes
fileWatcher.onChange(() => treeProvider.refresh());
```

#### 7.3 Tree View Configuration
Add to `package.json`:

```json
{
  "contributes": {
    "views": {
      "explorer": [
        {
          "id": "vibekanTasks",
          "name": "Vibe Kanban",
          "when": "vibekan.workspaceInitialized"
        }
      ]
    },
    "viewsWelcome": [
      {
        "view": "vibekanTasks",
        "contents": "No Vibe Kanban workspace found.\n[Create Workspace](command:vibekan.createWorkspace)\n[Open Existing](command:vibekan.openWorkspace)"
      }
    ]
  }
}
```

### Success Criteria
- ✅ Tree view shows stages and tasks
- ✅ Click task opens file
- ✅ Tree refreshes on file changes
- ✅ Welcome view shown when not initialized

### Dependencies
- Phase 1-6 (All previous phases)

---

## 🧪 Testing Strategy

### Unit Tests
- Data models (Task, Context, Workspace)
- Frontmatter parser (valid/invalid YAML)
- Context injector (all combinations)
- File operations (read, write, move, delete)
- Filename generator

### Integration Tests
- Task creation end-to-end
- Context assembly with real files
- Move task between stages
- File watcher triggers board refresh
- Copy with context includes all sections

### Manual Testing Checklist
- [ ] Create new workspace
- [ ] Add task via quick add
- [ ] Copy task with context (all 3 modes)
- [ ] Drag task between stages
- [ ] Edit file externally, verify board updates
- [ ] Delete task
- [ ] Search/filter tasks
- [ ] Keyboard shortcuts work
- [ ] Settings update behavior

---

## 📊 Acceptance Criteria (Final)

### Functional Requirements
- ✅ Create workspace with `.vibekan/` structure
- ✅ Create task in <30 seconds
- ✅ Copy with context in <10 seconds
- ✅ Move task between stages in <10 seconds
- ✅ Board displays all 6 stages
- ✅ Drag-and-drop between columns
- ✅ File watcher updates board on external changes
- ✅ Context injection works for stage/phase/agent/architecture
- ✅ User content never modified
- ✅ Keyboard shortcuts work

### Performance Requirements
- ✅ Board loads in <2 seconds (100+ tasks)
- ✅ No lag during drag-and-drop
- ✅ File watcher updates within 1 second

### Design Requirements
- ✅ Glassmorphism/liquid glass aesthetic
- ✅ Dark mode by default
- ✅ Responsive layout
- ✅ Smooth animations

### Technical Requirements
- ✅ Pure file-based storage (no database)
- ✅ Git-friendly (clean diffs)
- ✅ Works offline
- ✅ WorkspaceEdit API for open documents
- ✅ Error messages shown explicitly
- ✅ Unit tests pass

---

## 🚀 Launch Checklist

### Pre-Launch
- [ ] All phases complete
- [ ] All tests passing
- [ ] Manual testing complete
- [ ] README.md written
- [ ] CHANGELOG.md created
- [ ] package.json metadata filled
- [ ] Extension icon created

### Launch (Personal Use)
- [ ] Install in VSCode
- [ ] Test on real project
- [ ] Verify daily workflow improvements
- [ ] Measure time savings

### Post-Launch (Future)
- [ ] Gather feedback
- [ ] Fix bugs
- [ ] Add requested features
- [ ] Consider public release

---

## 📈 Success Metrics

### Time Savings (Target)
- Task creation: 3-5 min → <30 sec (90% reduction)
- Copy with context: 2-3 min → <10 sec (95% reduction)
- Move task: 1-2 min → <10 sec (90% reduction)
- **Daily savings: 30-60 minutes**

### Adoption Metrics (Personal Use)
- Tasks created per day
- Copy with context operations per day
- Drag-and-drop moves per day
- Keyboard shortcut usage

### Quality Metrics
- Zero data loss incidents
- Error rate <1%
- Board load time <2 seconds

---

## 🔮 Future Enhancements (Post-MVP)

### Phase 8: Advanced Features
- Task dependencies visualization
- Phase timeline view
- Bulk operations (move multiple tasks)
- Export board to PDF/image
- Custom stage definitions

### Phase 9: AI Integration
- Auto-suggest phase based on task content
- Context summarization for large files
- Task breakdown suggestions

### Phase 10: Collaboration (Maybe)
- Shared workspaces
- Real-time sync
- Comments on tasks
- Activity log

---

## 🛡️ Risk Register

### High Risk
1. **Data Loss:** User content accidentally modified
   **Mitigation:** Extensive testing, WorkspaceEdit API, preserve user content flag

2. **Performance Degradation:** Board slow with >100 tasks
   **Mitigation:** Virtualization, lazy loading, memoization

### Medium Risk
3. **File Watcher Bugs:** Infinite loops, missed updates
   **Mitigation:** Debouncing, change detection logic

4. **YAML Parsing Errors:** Special characters break frontmatter
   **Mitigation:** Validation layer, gray-matter library

### Low Risk
5. **Cross-Platform Issues:** Windows path handling
   **Mitigation:** Use path.posix, test on multiple platforms

---

## 📚 Technical Debt

### Intentional (For Speed)
- No database (file-based only)
- No multi-user support
- No cloud sync
- No telemetry
- Simple context assembly (no templates)

### To Address Later
- Add virtualization if board becomes slow
- Add migration tool if file format changes
- Add backup/restore feature
- Add extension API for plugins

---

## 🎯 Definition of Done

A phase is **DONE** when:
1. ✅ All tasks completed
2. ✅ Unit tests written and passing
3. ✅ Integration tests written and passing
4. ✅ Manual testing checklist complete
5. ✅ Success criteria met
6. ✅ No known bugs
7. ✅ Code reviewed (by AI agent if multi-agent workflow)
8. ✅ Documentation updated

The **entire project** is DONE when:
1. ✅ All 7 phases complete
2. ✅ Launch checklist complete
3. ✅ Used in real workflow for 1 week
4. ✅ Daily time savings verified (>30 min/day)
5. ✅ Zero data loss incidents
6. ✅ All acceptance criteria met

---

**End of Roadmap**

This roadmap provides a complete, detailed execution plan for building Vibe Kanban from foundation to polish. Each phase builds on the previous, with clear objectives, tasks, success criteria, and risk mitigations.

The multi-agent orchestrator can now use this roadmap to:
- Plan sprints
- Queue tasks by phase
- Hand off work to specialized agents (planner, coder, auditor)
- Track progress visually
- Copy context for each task

**Let's build something beautiful.** 🚀
