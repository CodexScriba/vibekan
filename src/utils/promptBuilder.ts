import { Task } from '../types/task';
import { CopyMode, CopySettings } from '../types/copy';

interface FullContextPayload {
  task: Task;
  stageContext?: string;
  phaseContext?: string | null;
  agentContext?: string | null;
  customContexts?: Record<string, string>;
  architecture?: string | null;
  userNotes?: string;
}

interface TaskOnlyPayload {
  task: Task;
  userNotes?: string;
}

interface ContextOnlyPayload {
  architecture?: string | null;
  stages: Record<string, string>;
  phases: Record<string, string>;
  agents: Record<string, string>;
}

export class PromptBuilder {
  constructor(
    private readonly settings: Pick<
      CopySettings,
      'includeTimestamps' | 'includeArchitecture' | 'xmlFormatting'
    >
  ) {}

  buildFullContext(payload: FullContextPayload): string {
    const sections: string[] = [];
    sections.push('<vibekan_task>');
    sections.push(this.buildMetadata(payload.task, 1));

    const stageContextContent =
      payload.stageContext && payload.stageContext.trim().length > 0
        ? payload.stageContext
        : `Add stage guidance in _context/stages/${payload.task.stage}.md`;
    sections.push(
      this.blockWithName('stage_context', payload.task.stage, stageContextContent, 1)
    );

    if (payload.phaseContext && payload.task.phase) {
      sections.push(
        this.blockWithName('phase_context', payload.task.phase, payload.phaseContext, 1)
      );
    }

    if (payload.agentContext && payload.task.agent) {
      sections.push(
        this.blockWithName(
          'agent_instructions',
          payload.task.agent,
          payload.agentContext,
          1
        )
      );
    }

    // Emit a custom_context block for each attached context
    if (payload.customContexts && Object.keys(payload.customContexts).length > 0) {
      for (const [name, content] of Object.entries(payload.customContexts)) {
        sections.push(
          this.blockWithName(
            'custom_context',
            name,
            content,
            1
          )
        );
      }
    }

    if (this.settings.includeArchitecture && payload.architecture) {
      sections.push(this.block('architecture', payload.architecture, 1));
    }

    const userNotes = payload.userNotes ?? '';
    sections.push(this.block('user_notes', userNotes, 1));
    sections.push(this.block('instructions', this.instructions(), 1));
    sections.push('</vibekan_task>');

    return this.format(sections.join('\n'));
  }

  buildTaskOnly(payload: TaskOnlyPayload): string {
    const sections: string[] = [];
    sections.push('<task>');
    sections.push(this.buildMetadata(payload.task, 1));
    sections.push(this.block('description', payload.userNotes ?? '', 1));
    sections.push('</task>');
    return this.format(sections.join('\n'));
  }

  buildContextOnly(payload: ContextOnlyPayload): string {
    const sections: string[] = [];
    sections.push('<project_context>');

    if (this.settings.includeArchitecture && payload.architecture) {
      sections.push(this.block('architecture', payload.architecture, 1));
    }

    if (Object.keys(payload.stages).length > 0) {
      sections.push(this.collection('stages', 'stage', payload.stages, 1));
    }

    if (Object.keys(payload.phases).length > 0) {
      sections.push(this.collection('phases', 'phase', payload.phases, 1));
    }

    if (Object.keys(payload.agents).length > 0) {
      sections.push(this.collection('agents', 'agent', payload.agents, 1));
    }

    sections.push('</project_context>');
    return this.format(sections.join('\n'));
  }

  private buildMetadata(task: Task, indentLevel: number): string {
    const lines: string[] = [];
    const pad = this.pad(indentLevel);
    lines.push(`${pad}<metadata>`);
    lines.push(`${this.pad(indentLevel + 1)}<id>${this.escape(task.id)}</id>`);
    lines.push(`${this.pad(indentLevel + 1)}<title>${this.escape(task.title)}</title>`);
    lines.push(`${this.pad(indentLevel + 1)}<stage>${this.escape(task.stage)}</stage>`);
    if (task.phase) {
      lines.push(`${this.pad(indentLevel + 1)}<phase>${this.escape(task.phase)}</phase>`);
    }
    if (task.agent) {
      lines.push(`${this.pad(indentLevel + 1)}<agent>${this.escape(task.agent)}</agent>`);
    }
    const tags = task.tags?.length ? task.tags.join(', ') : '';
    lines.push(`${this.pad(indentLevel + 1)}<tags>${this.escape(tags)}</tags>`);
    if (this.settings.includeTimestamps) {
      lines.push(
        `${this.pad(indentLevel + 1)}<created>${this.escape(task.created)}</created>`
      );
      lines.push(
        `${this.pad(indentLevel + 1)}<updated>${this.escape(task.updated)}</updated>`
      );
    }
    lines.push(`${pad}</metadata>`);
    return lines.join('\n');
  }

  private block(tag: string, content: string, indentLevel: number): string {
    const pad = this.pad(indentLevel);
    const body = this.indent(content, indentLevel + 1);
    return `${pad}<${tag}>\n${body}\n${pad}</${tag}>`;
  }

  private blockWithName(
    tag: string,
    name: string,
    content: string,
    indentLevel: number
  ): string {
    const pad = this.pad(indentLevel);
    const body = this.indent(content, indentLevel + 1);
    return `${pad}<${tag} name="${this.escapeAttr(name)}">\n${body}\n${pad}</${tag}>`;
  }

  private collection(
    wrapperTag: string,
    itemTag: string,
    items: Record<string, string>,
    indentLevel: number
  ): string {
    const pad = this.pad(indentLevel);
    const inner: string[] = [`${pad}<${wrapperTag}>`];
    for (const key of Object.keys(items)) {
      inner.push(this.blockWithName(itemTag, key, items[key], indentLevel + 1));
    }
    inner.push(`${pad}</${wrapperTag}>`);
    return inner.join('\n');
  }

  private pad(level: number): string {
    return '  '.repeat(level);
  }

  private indent(content: string, level: number): string {
    const normalized = this.escapeContent(content.trimEnd());
    const pad = this.pad(level);
    return normalized
      .split('\n')
      .map((line) => `${pad}${line}`)
      .join('\n');
  }

  private escape(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\]\]>/g, ']]&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private escapeAttr(input: string): string {
    return this.escape(input);
  }

  private escapeContent(input: string): string {
    return this.escape(input);
  }

  private format(xml: string): string {
    if (this.settings.xmlFormatting === 'compact') {
      return xml.replace(/>\s+</g, '><').trim();
    }
    return xml.trim();
  }

  private instructions(): string {
    return `## 🎯 Your Task

Using all the context provided above, complete the task described in the metadata section.

**Remember to:**
1. Follow the stage objectives and phase requirements
2. Adhere to your agent role and capabilities
3. Respect the architectural guidelines
4. Consider the custom context and user notes

**Output format:**
Provide your response in a clear, structured format. If writing code, include complete, runnable implementations.`;
  }
}
