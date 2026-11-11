import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.SKIP_ENSURE_DEPS === '1') {
  process.exit(0);
}

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = resolve(frontendRoot, 'package.json');
const lockPath = resolve(frontendRoot, 'package-lock.json');
const nodeModulesDir = resolve(frontendRoot, 'node_modules');
const npmLockMarker = resolve(nodeModulesDir, '.package-lock.json');
const hashFile = resolve(nodeModulesDir, '.deps-hash');
const pkgOnlyHashFile = resolve(nodeModulesDir, '.pkg-deps-hash');

function computeHashes() {
  const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const pkgDepsObj = {
    dependencies: pkgJson.dependencies ?? {},
    devDependencies: pkgJson.devDependencies ?? {},
    peerDependencies: pkgJson.peerDependencies ?? {},
    optionalDependencies: pkgJson.optionalDependencies ?? {},
  };
  const pkgOnlyHash = createHash('sha256').update(JSON.stringify(pkgDepsObj)).digest('hex');
  const lockContent = existsSync(lockPath) ? readFileSync(lockPath, 'utf8') : '';
  const combinedHash = createHash('sha256')
    .update(JSON.stringify({ ...pkgDepsObj, lockHash: createHash('sha256').update(lockContent).digest('hex') }))
    .digest('hex');
  return { pkgOnlyHash, combinedHash };
}

const initial = computeHashes();
const hasNodeModules = existsSync(nodeModulesDir) && existsSync(npmLockMarker);

if (hasNodeModules) {
  const savedHash = existsSync(hashFile) ? readFileSync(hashFile, 'utf8').trim() : '';
  if (savedHash === initial.combinedHash) {
    process.exit(0);
  }

  // Bootstrap cache marker if node_modules was already freshly installed manually
  if (!savedHash) {
    const markerTime = statSync(npmLockMarker).mtimeMs;
    const pkgTime = statSync(pkgPath).mtimeMs;
    const lockTime = existsSync(lockPath) ? statSync(lockPath).mtimeMs : 0;
    if (markerTime >= pkgTime && markerTime >= lockTime) {
      writeFileSync(hashFile, initial.combinedHash, 'utf8');
      writeFileSync(pkgOnlyHashFile, initial.pkgOnlyHash, 'utf8');
      process.exit(0);
    }
  }
}

const prevPkgOnlyHash = existsSync(pkgOnlyHashFile) ? readFileSync(pkgOnlyHashFile, 'utf8').trim() : '';
const pkgDepsChangedManually = prevPkgOnlyHash && prevPkgOnlyHash !== initial.pkgOnlyHash;
const cmd =
  pkgDepsChangedManually || !existsSync(lockPath)
    ? 'npm install --prefer-offline --no-audit --no-fund'
    : 'npm ci --prefer-offline --no-audit --no-fund';

console.log(`[ensure-deps] Dependency change detected — running: ${cmd}`);
execSync(cmd, { cwd: frontendRoot, stdio: 'inherit' });

const updated = computeHashes();
mkdirSync(nodeModulesDir, { recursive: true });
writeFileSync(hashFile, updated.combinedHash, 'utf8');
writeFileSync(pkgOnlyHashFile, updated.pkgOnlyHash, 'utf8');
