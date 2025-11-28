#!/usr/bin/env node
/**
 * Migration script to convert stage-prefixed task filenames to stable, stage-agnostic names.
 *
 * Features:
 * - Dry-run mode to preview changes
 * - Optional backups
 * - Graceful handling of missing IDs and conflicts
 *
 * Usage:
 *   node scripts/migrate-filenames.js --dry-run
 *   node scripts/migrate-filenames.js --backup
 *   node scripts/migrate-filenames.js --root /path/to/workspace
 */

const fs = require('fs/promises');
const path = require('path');

const STAGES = ['idea', 'queue', 'plan', 'code', 'audit', 'completed', 'archive'];
const LEGACY_STAGE_ALIASES = { chat: 'idea' };

function normalizeStage(name) {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  if (STAGES.includes(lower)) return lower;
  if (LEGACY_STAGE_ALIASES[lower]) return LEGACY_STAGE_ALIASES[lower];
  return undefined;
}

function slugify(input) {
  return (input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

function isStagePrefixed(baseName) {
  const lower = baseName.toLowerCase();
  for (const stage of STAGES) {
    if (lower.startsWith(`${stage}-`)) return true;
  }
  for (const legacy of Object.keys(LEGACY_STAGE_ALIASES)) {
    if (lower.startsWith(`${legacy}-`)) return true;
  }
  return false;
}

function getBaseSlug(idOrName) {
  const trimmed = (idOrName || '').replace(/\.md$/, '');
  const lower = trimmed.toLowerCase();
  for (const stage of STAGES) {
    const prefix = `${stage}-`;
    if (lower.startsWith(prefix)) return trimmed.slice(prefix.length);
  }
  for (const legacy of Object.keys(LEGACY_STAGE_ALIASES)) {
    const prefix = `${legacy}-`;
    if (lower.startsWith(prefix)) return trimmed.slice(prefix.length);
  }
  return trimmed;
}

function parseFrontmatter(text) {
  const result = {};
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1);
      result[key] = inner
        .split(',')
        .map((item) => {
          let token = item.trim();
          if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
            token = token.slice(1, -1);
          }
          return token;
        })
        .filter((item) => item.length > 0);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function serializeFrontmatter(data) {
  const lines = [];
  const keyOrder = ['id', 'title', 'stage', 'type', 'phase', 'agent', 'contexts', 'tags', 'order', 'created', 'updated'];
  const processed = new Set();

  for (const key of keyOrder) {
    if (data[key] === undefined) continue;
    processed.add(key);
    const value = data[key];
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (processed.has(key) || value === undefined) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  return lines.join('\n');
}

function deriveTimestampMs(frontmatter, stat) {
  if (frontmatter && typeof frontmatter.created === 'string') {
    const parsed = Date.parse(frontmatter.created);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (stat && typeof stat.ctimeMs === 'number') {
    return stat.ctimeMs;
  }
  return Date.now();
}

function ensureUniqueId(baseId, reserved) {
  const lowerReserved = reserved || new Set();
  let candidate = baseId;
  let counter = 1;
  while (lowerReserved.has(candidate.toLowerCase())) {
    candidate = `${baseId}-${counter}`;
    counter += 1;
  }
  return candidate;
}

async function planMigrations(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const vibekanRoot = path.join(rootDir, '.vibekan');
  const tasksRoot = path.join(vibekanRoot, 'tasks');

  const errors = [];
  const actions = [];
  const reserved = new Set();

  let taskDirs = [];
  try {
    taskDirs = await fs.readdir(tasksRoot, { withFileTypes: true });
  } catch (error) {
    throw new Error(`Cannot read tasks directory at ${tasksRoot}: ${error.message}`);
  }

  for (const dirent of taskDirs) {
    if (!dirent.isDirectory()) continue;
    const stage = normalizeStage(dirent.name);
    if (!stage) continue;
    const stageDir = path.join(tasksRoot, dirent.name);
    const entries = await fs.readdir(stageDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const baseName = entry.name.replace(/\.md$/, '');
      const filePath = path.join(stageDir, entry.name);
      if (!isStagePrefixed(baseName)) {
        reserved.add(baseName.toLowerCase());
        continue;
      }

      let content = '';
      try {
        content = await fs.readFile(filePath, 'utf8');
      } catch (readError) {
        errors.push(`Failed to read ${filePath}: ${readError.message}`);
        continue;
      }

      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      const frontmatter = fmMatch ? parseFrontmatter(fmMatch[1]) : {};
      let stat = null;
      try {
        stat = await fs.stat(filePath);
      } catch {
        stat = null;
      }

      const baseFromId = typeof frontmatter.id === 'string' ? getBaseSlug(frontmatter.id) : null;
      const slug = slugify(baseFromId || getBaseSlug(baseName));
      const preferredId =
        typeof frontmatter.id === 'string' && !isStagePrefixed(frontmatter.id) ? slugify(frontmatter.id) : null;
      const timestamp = deriveTimestampMs(frontmatter, stat);
      const baseId = preferredId || `${timestamp}-${slug}`;
      const uniqueId = ensureUniqueId(baseId, reserved);
      reserved.add(uniqueId.toLowerCase());

      const nextFileName = `${uniqueId}.md`;
      const nextPath = path.join(stageDir, nextFileName);
      const bodyStart = fmMatch ? fmMatch[0].length : 0;
      const body = bodyStart > 0 ? content.slice(bodyStart) : `\n\n${content}`;
      const updatedFrontmatter = { ...frontmatter };
      updatedFrontmatter.id = uniqueId;
      if (!updatedFrontmatter.stage) updatedFrontmatter.stage = stage;
      if (!updatedFrontmatter.created && stat) {
        updatedFrontmatter.created = new Date(stat.ctimeMs).toISOString();
      }

      const needsRewrite = !frontmatter || frontmatter.id !== uniqueId || !frontmatter.stage;
      const nextContent = needsRewrite ? `---\n${serializeFrontmatter(updatedFrontmatter)}\n---${body}` : content;

      actions.push({
        stage,
        from: filePath,
        to: nextPath,
        newId: uniqueId,
        needsContentUpdate: needsRewrite,
        nextContent,
      });
    }
  }

  return { vibekanRoot, tasksRoot, actions, errors };
}

async function applyMigrations(plan, options = {}) {
  const dryRun = !!options.dryRun;
  const backup = !!options.backup;
  const logger = options.logger || console;
  const results = [];

  let backupRoot = null;
  if (backup && !dryRun) {
    backupRoot = path.join(plan.vibekanRoot, 'backups', `migrate-filenames-${Date.now()}`);
  }

  for (const action of plan.actions) {
    if (dryRun) {
      logger.info(`[dry-run] ${action.from} -> ${action.to}`);
      results.push({ ...action, status: 'dry-run' });
      continue;
    }

    try {
      if (backupRoot) {
        const relPath = path.relative(plan.vibekanRoot, action.from);
        const backupPath = path.join(backupRoot, relPath);
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        await fs.copyFile(action.from, backupPath);
        action.backupPath = backupPath;
      }

      await fs.rename(action.from, action.to);
      if (action.needsContentUpdate) {
        await fs.writeFile(action.to, action.nextContent, 'utf8');
      }

      logger.info(`Renamed ${action.from} -> ${action.to}`);
      results.push({ ...action, status: 'migrated' });
    } catch (error) {
      logger.error(`Failed to migrate ${action.from}: ${error.message}`);
      results.push({ ...action, status: 'error', error: error.message });
    }
  }

  return { results, backupRoot, dryRun };
}

async function migrateFilenames(options = {}) {
  const logger = options.logger || console;
  const plan = await planMigrations(options);

  if (plan.errors.length > 0) {
    plan.errors.forEach((err) => logger.error(err));
  }

  if (plan.actions.length === 0) {
    logger.info('No stage-prefixed filenames detected. Nothing to migrate.');
    return { results: [], backupRoot: null, dryRun: !!options.dryRun };
  }

  logger.info(`Found ${plan.actions.length} stage-prefixed file(s) to migrate.`);
  if (options.dryRun) {
    logger.info('Dry run enabled; no changes will be written.');
  }
  if (options.backup && !options.dryRun) {
    logger.info('Backups enabled; originals will be copied before renaming.');
  }

  return applyMigrations(plan, options);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = { dryRun: false, backup: false, rootDir: process.cwd() };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--dry-run' || arg === '-n') {
      options.dryRun = true;
    } else if (arg === '--backup' || arg === '-b') {
      options.backup = true;
    } else if (arg === '--root' || arg === '-r') {
      const next = args[i + 1];
      if (!next) {
        throw new Error('Missing value for --root');
      }
      options.rootDir = next;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function printHelp() {
  console.log(`Vibekan filename migration

Usage:
  node scripts/migrate-filenames.js [--dry-run] [--backup] [--root <path>]

Options:
  --dry-run, -n   Preview changes without modifying files
  --backup, -b    Copy originals to .vibekan/backups before renaming
  --root, -r      Workspace root containing .vibekan (default: cwd)
  --help, -h      Show this help
`);
}

if (require.main === module) {
  (async () => {
    try {
      const options = parseArgs(process.argv);
      if (options.help) {
        printHelp();
        return;
      }
      await migrateFilenames(options);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  })();
}

module.exports = {
  migrateFilenames,
  planMigrations,
  parseFrontmatter,
  serializeFrontmatter,
  slugify,
  isStagePrefixed,
};
