import fs from 'fs';
import os from 'os';
import path from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, afterAll, beforeEach } from 'vitest';

// Prepare a temporary workspace root for filesystem-driven tests and surface it to the vscode mock
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vibekan-idea-test-'));
process.env.VIBEKAN_TEST_ROOT = tempRoot;

import * as vscode from 'vscode';
import { STAGES, STAGE_LABELS, STAGE_ICONS } from '../types/task';
import { TaskModal } from '../components/TaskModal';
import { TEST_API } from '../extension';

describe('Rename Chat -> Idea', () => {
  afterAll(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('stage registry exposes idea and not chat', () => {
    expect(STAGES).toContain('idea');
    expect(STAGES).not.toContain('chat');
    expect(STAGE_LABELS.idea).toBe('Idea');
    expect(STAGE_ICONS.idea).toBe('💡');
  });

  it('TaskModal defaults to the idea stage', () => {
    render(
      <TaskModal
        open
        onClose={() => {}}
        onSubmit={() => {}}
        contextData={{ phases: [], agents: [], contexts: [], templates: [] }}
      />
    );

    const stageSelect = screen.getByLabelText(/stage/i) as HTMLSelectElement;
    expect(stageSelect.value).toBe('idea');
  });

  describe('scaffolding', () => {
    const vibekanUri = vscode.Uri.joinPath(vscode.Uri.file(tempRoot), '.vibekan');

    beforeEach(async () => {
      await fs.promises.rm(vibekanUri.fsPath, { recursive: true, force: true });
    });

    it('creates idea stage folder and context file', async () => {
      await TEST_API.scaffoldVibekanWorkspace(vibekanUri);

      const ideaDir = path.join(vibekanUri.fsPath, 'tasks', 'idea');
      const ideaContext = path.join(vibekanUri.fsPath, '_context', 'stages', 'idea.md');

      expect(fs.existsSync(ideaDir)).toBe(true);
      expect(fs.existsSync(ideaContext)).toBe(true);
      expect(fs.readFileSync(ideaContext, 'utf8')).toContain('Stage: idea');
    });
  });
});
