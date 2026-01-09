import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface GitResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Validates that a path is a git repository
 */
export function isGitRepo(repoPath: string): boolean {
  try {
    const resolvedPath = path.resolve(repoPath);
    if (!fs.existsSync(resolvedPath)) {
      return false;
    }
    execSync('git rev-parse --git-dir', {
      cwd: resolvedPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the working tree diff for a repository
 */
export function getWorkingTreeDiff(repoPath: string): GitResult {
  try {
    const resolvedPath = path.resolve(repoPath);

    if (!fs.existsSync(resolvedPath)) {
      return { success: false, error: `Path does not exist: ${repoPath}` };
    }

    if (!isGitRepo(resolvedPath)) {
      return { success: false, error: `Not a git repository: ${repoPath}` };
    }

    // Get both staged and unstaged changes
    const stagedDiff = execSync('git diff --cached', {
      cwd: resolvedPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const unstagedDiff = execSync('git diff', {
      cwd: resolvedPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Also get untracked files summary
    const untrackedFiles = execSync('git ls-files --others --exclude-standard', {
      cwd: resolvedPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    let output = '';

    if (stagedDiff) {
      output += '# Staged Changes\n' + stagedDiff;
    }

    if (unstagedDiff) {
      if (output) output += '\n';
      output += '# Unstaged Changes\n' + unstagedDiff;
    }

    if (untrackedFiles) {
      if (output) output += '\n';
      output += '# Untracked Files\n';
      output += untrackedFiles.split('\n').map(f => `? ${f}`).join('\n');
    }

    if (!output) {
      output = '# No changes detected in working tree';
    }

    return { success: true, output };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Git error: ${error}` };
  }
}

/**
 * Gets the current branch name
 */
export function getCurrentBranch(repoPath: string): string | null {
  try {
    const resolvedPath = path.resolve(repoPath);
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: resolvedPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return branch;
  } catch {
    return null;
  }
}
