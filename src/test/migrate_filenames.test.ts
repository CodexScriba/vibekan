import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { migrateFilenames, planMigrations, parseFrontmatter } = require('../../scripts/migrate-filenames');

describe('migrate-filenames script', () => {
  let workspaceRoot: string;
  let vibekanRoot: string;

  const writeTask = async (stage: string, fileName: string, content: string) => {
    const stageDir = path.join(vibekanRoot, 'tasks', stage);
    await fsp.mkdir(stageDir, { recursive: true });
    const filePath = path.join(stageDir, fileName);
    await fsp.writeFile(filePath, content, 'utf8');
    return filePath;
  };

  beforeEach(async () => {
    workspaceRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'vibekan-migrate-'));
    vibekanRoot = path.join(workspaceRoot, '.vibekan');
    await fsp.mkdir(path.join(vibekanRoot, 'tasks'), { recursive: true });
  });

  afterEach(async () => {
    if (workspaceRoot) {
      await fsp.rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('renames stage-prefixed files and updates IDs', async () => {
    const originalPath = await writeTask(
      'idea',
      'idea-add-project-field.md',
      `---
id: idea-add-project-field
title: Add project field
stage: idea
created: 2024-01-01T00:00:00.000Z
updated: 2024-01-02T00:00:00.000Z
order: 1
type: task
---

Body`
    );

    const result = await migrateFilenames({ rootDir: workspaceRoot });
    expect(result.dryRun).toBe(false);
    expect(fs.existsSync(originalPath)).toBe(false);

    const ideaDir = path.join(vibekanRoot, 'tasks', 'idea');
    const files = await fsp.readdir(ideaDir);
    expect(files.length).toBe(1);
    const renamed = path.join(ideaDir, files[0]);
    expect(path.basename(renamed)).not.toMatch(/^idea-/);

    const text = await fsp.readFile(renamed, 'utf8');
    const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
    expect(fmMatch).toBeTruthy();
    const fm = parseFrontmatter(fmMatch![1]);
    expect(fm.id).toBe(path.basename(renamed, '.md'));
    expect(fm.stage).toBe('idea');
    expect(text).toContain('Body');
  });

  it('supports dry-run without modifying files', async () => {
    const originalPath = await writeTask(
      'plan',
      'plan-capacity-forecast.md',
      `---
id: plan-capacity-forecast
title: Capacity forecast
stage: plan
---
`
    );

    const result = await migrateFilenames({ rootDir: workspaceRoot, dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(fs.existsSync(originalPath)).toBe(true);
    expect(result.results.length).toBe(1);

    const files = await fsp.readdir(path.join(vibekanRoot, 'tasks', 'plan'));
    expect(files.includes('plan-capacity-forecast.md')).toBe(true);
  });

  it('creates backups when requested', async () => {
    const originalPath = await writeTask(
      'queue',
      'queue-backup-me.md',
      `---
id: queue-backup-me
title: Backup Me
stage: queue
---
content`
    );

    const result = await migrateFilenames({ rootDir: workspaceRoot, backup: true });
    expect(result.backupRoot).toBeTruthy();
    expect(fs.existsSync(originalPath)).toBe(false);

    const backupPath = path.join(
      result.backupRoot!,
      path.relative(vibekanRoot, path.join(vibekanRoot, 'tasks', 'queue', 'queue-backup-me.md'))
    );
    expect(fs.existsSync(backupPath)).toBe(true);
    const backupContent = await fsp.readFile(backupPath, 'utf8');
    expect(backupContent).toContain('Backup Me');
  });

  it('respects stable IDs in frontmatter for the new filename', async () => {
    await writeTask(
      'code',
      'code-keep-id.md',
      `---
id: custom-stable-id
title: Stable
stage: code
---
body`
    );

    await migrateFilenames({ rootDir: workspaceRoot });

    const files = await fsp.readdir(path.join(vibekanRoot, 'tasks', 'code'));
    expect(files).toContain('custom-stable-id.md');
    expect(files.some((f) => f.startsWith('code-'))).toBe(false);

    const text = await fsp.readFile(path.join(vibekanRoot, 'tasks', 'code', 'custom-stable-id.md'), 'utf8');
    expect(text).toContain('id: custom-stable-id');
  });

  it('adds IDs when missing and avoids collisions', async () => {
    await writeTask('audit', 'audit-no-id.md', `---\ntitle: Audit\nstage: audit\n---\nbody`);
    await writeTask('completed', 'completed-no-id.md', `---\ntitle: Done\nstage: completed\n---\nbody`);

    const plan = await planMigrations({ rootDir: workspaceRoot });
    const targetNames = plan.actions.map((a: any) => path.basename(a.to));
    expect(targetNames.every((name: string) => !name.startsWith('audit-'))).toBe(true);
    // Ensure two files don't collide
    const uniqueNames = new Set(targetNames);
    expect(uniqueNames.size).toBe(targetNames.length);
  });
});
