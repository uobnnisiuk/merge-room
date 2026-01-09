/**
 * Postinstall script: builds better-sqlite3 native module if needed
 * This handles the case where pnpm doesn't run build scripts by default
 */
import { execSync, spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const nodeModules = join(__dirname, '..', 'node_modules');

// Find better-sqlite3 in pnpm structure
function findBetterSqlite3() {
  const pnpmPath = join(nodeModules, '.pnpm');
  if (!existsSync(pnpmPath)) return null;

  try {
    const result = spawnSync('find', [pnpmPath, '-maxdepth', '2', '-name', 'better-sqlite3@*', '-type', 'd'], {
      encoding: 'utf-8',
    });
    const dirs = result.stdout.trim().split('\n').filter(Boolean);
    if (dirs.length > 0) {
      return join(dirs[0], 'node_modules', 'better-sqlite3');
    }
  } catch {
    // Fallback for Windows
    const possiblePaths = [
      join(nodeModules, 'better-sqlite3'),
      join(nodeModules, '.pnpm', 'better-sqlite3@11.10.0', 'node_modules', 'better-sqlite3'),
    ];
    for (const p of possiblePaths) {
      if (existsSync(p)) return p;
    }
  }
  return null;
}

function main() {
  const sqlitePath = findBetterSqlite3();
  if (!sqlitePath) {
    console.log('[postinstall] better-sqlite3 not found, skipping native build');
    return;
  }

  const nativeModule = join(sqlitePath, 'build', 'Release', 'better_sqlite3.node');
  if (existsSync(nativeModule)) {
    console.log('[postinstall] better-sqlite3 native module already built');
    return;
  }

  console.log('[postinstall] Building better-sqlite3 native module...');
  try {
    execSync('npm run build-release', {
      cwd: sqlitePath,
      stdio: 'inherit',
    });
    console.log('[postinstall] Native module built successfully');
  } catch (err) {
    console.error('[postinstall] Failed to build native module. You may need to:');
    console.error('  1. Install C++ build tools (build-essential on Linux, Xcode on macOS, Visual Studio on Windows)');
    console.error('  2. Run manually: cd ' + sqlitePath + ' && npm run build-release');
    process.exit(1);
  }
}

main();
