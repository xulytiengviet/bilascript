/**
 * BilaScript architecture ownership model.
 *
 * IMPORTANT: ratios are an architectural/conceptual model. They are NOT
 * source-line percentages, performance claims, or ECMAScript conformance scores.
 * The model exists to explain which capabilities BilaScript owns at compile time
 * and which capabilities are delegated to JavaScript engines / host APIs.
 */

const freezeWeights = (weights) => Object.freeze({ ...weights });

export const ARCHITECTURE_LAYERS = Object.freeze([
  Object.freeze({
    id: 'spec',
    name: 'Đặc tả ngôn ngữ',
    sub: 'Vocabulary / semantic mapping',
    bilaShare: 0.80,
    weights: freezeWeights({ equal: 1 / 6, languageCore: 0.25, runtimeHeavy: 0.15 }),
    description: 'BilaScript sở hữu phần lớn vocabulary CVNSS4.0, semantic IDs, alias policy và quy tắc lowering. JavaScript vẫn cung cấp cấu trúc dữ liệu và Unicode primitives nền.',
    evidence: ['v4/src/vocabulary.js', 'v4/src/semantic.js']
  }),
  Object.freeze({
    id: 'compiler',
    name: 'Frontend biên dịch',
    sub: 'Lexer / Parser / Semantic / Normalize / Codegen',
    bilaShare: 0.90,
    weights: freezeWeights({ equal: 1 / 6, languageCore: 0.30, runtimeHeavy: 0.20 }),
    description: 'Lexer, parser, Bila AST, compile-time evidence, normalization và codegen là lõi do BilaScript kiểm soát. Đích sinh mã vẫn là JavaScript chuẩn.',
    evidence: ['v4/src/lexer.js', 'v4/src/parser.js', 'v4/src/normalize.js', 'v4/src/codegen-js.js']
  }),
  Object.freeze({
    id: 'runtime',
    name: 'Môi trường thực thi',
    sub: 'V8 / SpiderMonkey / JavaScriptCore / Node / Bun',
    bilaShare: 0.00,
    weights: freezeWeights({ equal: 1 / 6, languageCore: 0.15, runtimeHeavy: 0.25 }),
    description: 'BilaScript v4 không xây runtime riêng và không chèn runtime translator/helper. JavaScript engine chịu trách nhiệm thực thi, bộ nhớ, GC và event loop.',
    evidence: ['v4/PERFORMANCE_CONTRACT.md']
  }),
  Object.freeze({
    id: 'stdlib',
    name: 'JavaScript & Host APIs',
    sub: 'ECMAScript built-ins / Web APIs / Node APIs',
    bilaShare: 0.00,
    weights: freezeWeights({ equal: 1 / 6, languageCore: 0.10, runtimeHeavy: 0.15 }),
    description: 'BilaScript tái sử dụng built-ins và API của JavaScript/host thay vì nhân bản một standard library mới. Alias chỉ được lowering khi có đủ bằng chứng compile-time.',
    evidence: ['v4/src/type-system.js', 'v4/src/normalize.js']
  }),
  Object.freeze({
    id: 'tooling',
    name: 'Tooling & kiểm chứng',
    sub: 'Diagnostics / LSP / conformance / source map',
    bilaShare: 0.60,
    weights: freezeWeights({ equal: 1 / 6, languageCore: 0.10, runtimeHeavy: 0.10 }),
    description: 'BilaScript sở hữu diagnostics, language service, LSP, conformance corpus và zero-helper audit; một phần tooling dựa trên hệ sinh thái JavaScript/TypeScript.',
    evidence: ['v4/src/language-service.js', 'v4/src/source-map.js', 'v4/conformance/']
  }),
  Object.freeze({
    id: 'app',
    name: 'Ứng dụng & giao diện',
    sub: 'Playground / website / integration wrappers',
    bilaShare: 0.40,
    weights: freezeWeights({ equal: 1 / 6, languageCore: 0.10, runtimeHeavy: 0.15 }),
    description: 'Phần trải nghiệm BilaScript là logic tích hợp riêng, nhưng DOM, CSS, browser modules và giao diện nền vẫn thuộc web platform / JavaScript ecosystem.',
    evidence: ['index.html', 'site/architecture-ratio-3d.js']
  })
]);

export const ARCHITECTURE_PRESETS = Object.freeze({
  equal: Object.freeze({ id: 'equal', label: 'Cân bằng 6 tầng', note: 'Mỗi tầng có trọng số như nhau.' }),
  languageCore: Object.freeze({ id: 'languageCore', label: 'Ưu tiên lõi ngôn ngữ', note: 'Nhấn mạnh Specification và Compiler frontend.' }),
  runtimeHeavy: Object.freeze({ id: 'runtimeHeavy', label: 'Ưu tiên hạ tầng thực thi', note: 'Nhấn mạnh Runtime và JavaScript/Host APIs.' })
});

export function computeArchitectureShare(preset = 'equal') {
  if (!ARCHITECTURE_PRESETS[preset]) throw new RangeError(`Unknown architecture preset: ${preset}`);
  const bila = ARCHITECTURE_LAYERS.reduce((sum, layer) => sum + layer.bilaShare * layer.weights[preset], 0);
  return Object.freeze({
    preset,
    bila,
    javascriptHost: 1 - bila,
    bilaPercent: bila * 100,
    javascriptHostPercent: (1 - bila) * 100
  });
}

export function getArchitectureBreakdown(preset = 'equal') {
  computeArchitectureShare(preset); // validates preset
  return ARCHITECTURE_LAYERS.map((layer) => Object.freeze({
    id: layer.id,
    name: layer.name,
    sub: layer.sub,
    bilaShare: layer.bilaShare,
    javascriptHostShare: 1 - layer.bilaShare,
    weight: layer.weights[preset],
    contribution: layer.bilaShare * layer.weights[preset],
    description: layer.description,
    evidence: layer.evidence
  }));
}

export function validateArchitectureModel() {
  const errors = [];
  for (const preset of Object.keys(ARCHITECTURE_PRESETS)) {
    const weightSum = ARCHITECTURE_LAYERS.reduce((sum, layer) => sum + layer.weights[preset], 0);
    if (Math.abs(weightSum - 1) > 1e-9) errors.push(`${preset}: weights sum to ${weightSum}`);
  }
  for (const layer of ARCHITECTURE_LAYERS) {
    if (layer.bilaShare < 0 || layer.bilaShare > 1) errors.push(`${layer.id}: bilaShare out of range`);
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
