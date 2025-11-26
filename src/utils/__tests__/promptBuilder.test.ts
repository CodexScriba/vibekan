import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../promptBuilder';
import { Task } from '../../types/task';

describe('PromptBuilder', () => {
  const mockTask: Task = {
    id: 'task-123',
    title: 'Test Task',
    stage: 'plan',
    phase: 'Phase A',
    agent: 'planner',
    tags: ['test', 'unit'],
    created: '2023-01-01T00:00:00Z',
    updated: '2023-01-02T00:00:00Z',
    order: 1,
    context: 'custom-context',
    filePath: '/path/to/task.md',
  };

  const defaultSettings = {
    includeTimestamps: true,
    includeArchitecture: true,
    xmlFormatting: 'pretty' as const,
  };

  it('buildFullContext generates correct XML with all fields', () => {
    const builder = new PromptBuilder(defaultSettings);
    const result = builder.buildFullContext({
      task: mockTask,
      stageContext: 'Stage Context Content',
      phaseContext: 'Phase Context Content',
      agentContext: 'Agent Context Content',
      customContext: 'Custom Context Content',
      architecture: 'Architecture Content',
      userNotes: 'User Notes Content',
    });

    expect(result).toContain('<vibekan_task>');
    expect(result).toContain('<id>task-123</id>');
    expect(result).toContain('<title>Test Task</title>');
    expect(result).toContain('<stage_context name="plan">');
    expect(result).toContain('Stage Context Content');
    expect(result).toContain('<phase_context name="Phase A">');
    expect(result).toContain('Phase Context Content');
    expect(result).toContain('<agent_instructions name="planner">');
    expect(result).toContain('Agent Context Content');
    expect(result).toContain('<custom_context name="custom-context">');
    expect(result).toContain('Custom Context Content');
    expect(result).toContain('<architecture>');
    expect(result).toContain('Architecture Content');
    expect(result).toContain('<user_notes>');
    expect(result).toContain('User Notes Content');
    expect(result).toContain('</vibekan_task>');
  });

  it('buildFullContext handles missing optional context', () => {
    const builder = new PromptBuilder(defaultSettings);
    const result = builder.buildFullContext({
      task: mockTask,
    });

    expect(result).toContain('<vibekan_task>');
    // Should use default stage context message if missing
    expect(result).toContain('Add stage guidance in _context/stages/plan.md');
    // Should not contain optional blocks if data is missing
    expect(result).not.toContain('<phase_context');
    expect(result).not.toContain('<agent_instructions');
    expect(result).not.toContain('<custom_context');
    expect(result).not.toContain('<architecture>');
    expect(result).toContain('<user_notes>'); // Always present, empty if missing
  });

  it('buildTaskOnly generates correct XML', () => {
    const builder = new PromptBuilder(defaultSettings);
    const result = builder.buildTaskOnly({
      task: mockTask,
      userNotes: 'Some notes',
    });

    expect(result).toContain('<task>');
    expect(result).toContain('<id>task-123</id>');
    expect(result).toContain('<description>');
    expect(result).toContain('Some notes');
    expect(result).toContain('</task>');
  });

  it('buildContextOnly generates correct XML', () => {
    const builder = new PromptBuilder(defaultSettings);
    const result = builder.buildContextOnly({
      architecture: 'Arch',
      stages: { plan: 'Plan Content' },
      phases: { A: 'Phase A Content' },
      agents: { coder: 'Coder Content' },
    });

    expect(result).toContain('<project_context>');
    expect(result).toContain('<architecture>');
    expect(result).toContain('Arch');
    expect(result).toContain('<stages>');
    expect(result).toContain('<stage name="plan">');
    expect(result).toContain('Plan Content');
    expect(result).toContain('<phases>');
    expect(result).toContain('<phase name="A">');
    expect(result).toContain('Phase A Content');
    expect(result).toContain('<agents>');
    expect(result).toContain('<agent name="coder">');
    expect(result).toContain('Coder Content');
    expect(result).toContain('</project_context>');
  });

  it('respects includeTimestamps setting', () => {
    const builder = new PromptBuilder({ ...defaultSettings, includeTimestamps: false });
    const result = builder.buildFullContext({ task: mockTask });
    expect(result).not.toContain('<created>');
    expect(result).not.toContain('<updated>');
  });

  it('respects includeArchitecture setting', () => {
    const builder = new PromptBuilder({ ...defaultSettings, includeArchitecture: false });
    const result = builder.buildFullContext({
      task: mockTask,
      architecture: 'Arch',
    });
    expect(result).not.toContain('<architecture>');
  });

  it('respects xmlFormatting compact setting', () => {
    const builder = new PromptBuilder({ ...defaultSettings, xmlFormatting: 'compact' });
    const result = builder.buildFullContext({ task: mockTask });
    // Compact mode removes whitespace between tags
    expect(result).not.toMatch(/>\s+</);
  });
});
