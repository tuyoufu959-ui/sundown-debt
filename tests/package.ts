// Standard-library packaging audit. This supplements, and does not impersonate, the site gate.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildDossier, htmlFacts, readGameTree, resolveGamePath, sourceImports } from '../vendor/makefun-game.ts';

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const checks = [];
const check = (name, ok) => { assert.ok(ok, name); checks.push(name); };
const tree = readGameTree('game', caps);
check('Game tree meets the kit caps', tree.count <= 993 && tree.totalBytes <= 50331648);
check('Unchanged vendor SHA-256', sha(readFileSync('vendor/makefun-game.ts')) === 'dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129');
const facts = htmlFacts(readFileSync('game/index.html', 'utf8'));
const refs = [...facts.scripts.map(s => s.src), ...facts.links.map(l => l.href), ...facts.resources.map(r => r.src)].filter(Boolean);
for (const ref of refs) {
  if (ref.startsWith('data:')) continue;
  const path = resolveGamePath(ref, 'index.html');
  assert.ok(path && statSync(join('game', path)).isFile(), `Local HTML reference: ${ref}`);
}
for (const file of tree.files.filter(f => f.path.endsWith('.js'))) {
  for (const ref of sourceImports(readFileSync(join('game', file.path), 'utf8'))) {
    assert.ok(ref.startsWith('data:') || resolveGamePath(ref, file.path), `Local script reference: ${ref}`);
  }
}
check('Every declared reference stays inside game or data URI', true);
const shots = readdirSync('screenshots').filter(n => !n.startsWith('.')).sort();
check('Exactly three screenshot files', shots.length === 3);
const images = shots.map(name => {
  assert.match(name, /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/);
  const bytes = readFileSync(join('screenshots', name));
  assert.ok(bytes.length <= 262144);
  assert.equal(bytes.readUInt16BE(0), 0xffd8);
  assert.equal(bytes.readUInt16BE(bytes.length - 2), 0xffd9);
  let offset = 2;
  let width = 0;
  let height = 0;
  while (offset < bytes.length) {
    const marker = bytes.readUInt16BE(offset);
    const size = bytes.readUInt16BE(offset + 2);
    if ([0xffc0, 0xffc1, 0xffc2].includes(marker)) {
      height = bytes.readUInt16BE(offset + 5);
      width = bytes.readUInt16BE(offset + 7);
      break;
    }
    offset += size + 2;
  }
  assert.equal(width, 1280);
  assert.equal(height, 720);
  return { name, bytes: bytes.length, width, height, sha256: sha(bytes) };
});
check('All screenshots are complete 1280x720 JPEGs under 256 KiB', true);
const temp = mkdtempSync(join(tmpdir(), 'sundown-determinism-'));
const directories = [join(temp, 'first'), join(temp, 'second')];
for (const directory of directories) {
  const result = spawnSync(process.execPath, ['main.ts'], {
    cwd: resolve('.'), env: { ...process.env, MAKEFUN_OUTPUT_DIR: directory }, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
}
const a = readFileSync(join(directories[0], 'dossier.json'));
const b = readFileSync(join(directories[1], 'dossier.json'));
check('Two fresh output directories produce byte-identical dossiers', a.equals(b));
check('Dossier matches unchanged buildDossier exactly', a.equals(Buffer.from(buildDossier(directories[0], caps))));
check('Dossier stays under 1.5 MiB', a.length <= 1572864);
const output = readFileSync('out/dossier.json');
check('Requested out/dossier.json matches clean runs', output.equals(a));
copyFileSync('out/dossier.json', 'dossier.json');
const result = { status: 'passed', checks, game: { filesAndDirectories: tree.count, bytes: tree.totalBytes },
  images, dossier: { bytes: a.length, sha256: sha(a) }, runtime: process.version };
writeFileSync('package-validation.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
