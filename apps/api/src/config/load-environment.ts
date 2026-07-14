import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

type LoadedEnvironment = {
  apiEnvPath: string;
  rootEnvPath: string;
  loadedFiles: string[];
};

/**
 * Loads local environment files without overriding values supplied by the
 * process (deployment variables always win). apps/api/.env overrides the root
 * fallback for local development.
 */
export function loadEnvironment(): LoadedEnvironment {
  const resolvedRoot = resolve(__dirname, '..', '..');
  const apiRoot = basename(resolvedRoot) === 'dist' ? resolve(resolvedRoot, '..') : resolvedRoot;
  const projectRoot = resolve(apiRoot, '..', '..');
  const apiEnvPath = resolve(apiRoot, '.env');
  const rootEnvPath = resolve(projectRoot, '.env');
  const processKeys = new Set(Object.keys(process.env));
  const loadedFiles: string[] = [];

  loadFile(rootEnvPath, processKeys, false);
  if (existsSync(rootEnvPath)) loadedFiles.push(rootEnvPath);
  loadFile(apiEnvPath, processKeys, true);
  if (existsSync(apiEnvPath)) loadedFiles.push(apiEnvPath);

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') process.env[key] = trimWrappingQuotes(value.trim());
  }

  return { apiEnvPath, rootEnvPath, loadedFiles };
}

function loadFile(path: string, processKeys: Set<string>, overrideFallback: boolean) {
  if (!existsSync(path)) return;
  const parsed = parseEnvironmentFile(readFileSync(path, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    if (processKeys.has(key)) continue;
    if (!overrideFallback && process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

export function parseEnvironmentFile(content: string) {
  const values: Record<string, string> = {};
  for (const sourceLine of content.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith('#')) continue;
    const normalized = line.startsWith('export ') ? line.slice(7).trim() : line;
    const separator = normalized.indexOf('=');
    if (separator <= 0) continue;
    const key = normalized.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    const rawValue = normalized.slice(separator + 1).trim();
    values[key] = trimWrappingQuotes(stripUnquotedComment(rawValue));
  }
  return values;
}

function stripUnquotedComment(value: string) {
  if (value.startsWith('"') || value.startsWith("'")) return value;
  const comment = value.search(/\s+#/);
  return comment === -1 ? value : value.slice(0, comment).trimEnd();
}

function trimWrappingQuotes(value: string) {
  if (value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  return (first === '"' && last === '"') || (first === "'" && last === "'")
    ? value.slice(1, -1).trim()
    : value;
}
