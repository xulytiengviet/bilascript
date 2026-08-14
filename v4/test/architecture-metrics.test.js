import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  ARCHITECTURE_LAYERS,
  ARCHITECTURE_PRESETS,
  computeArchitectureShare,
  validateArchitectureModel
} from '../src/architecture-metrics.js';

const here = dirname(fileURLToPath(import.meta.url));

test('architecture ownership model is internally valid', () => {
  assert.equal(validateArchitectureModel().ok, true);
  assert.equal(ARCHITECTURE_LAYERS.length, 6);
  assert.deepEqual(Object.keys(ARCHITECTURE_PRESETS), ['equal', 'languageCore', 'runtimeHeavy']);
});

test('documented presets remain stable', () => {
  assert.equal(computeArchitectureShare('equal').bilaPercent, 45);
  assert.equal(computeArchitectureShare('languageCore').bilaPercent, 57);
  assert.equal(computeArchitectureShare('runtimeHeavy').bilaPercent, 42);
  for (const preset of Object.keys(ARCHITECTURE_PRESETS)) {
    const result = computeArchitectureShare(preset);
    assert.ok(Math.abs(result.bila + result.javascriptHost - 1) < 1e-12);
  }
});

test('site architecture visualizer has no external 3D CDN dependency', () => {
  const source = fs.readFileSync(resolve(here, '../../site/architecture-ratio-3d.js'), 'utf8');
  assert.doesNotMatch(source, /unpkg\.com|cdn\.jsdelivr\.net|esm\.sh|OrbitControls|three\.module/i);
  assert.match(source, /LOCAL 3D · ZERO CDN/);
  assert.match(source, /transform-style/);
});
