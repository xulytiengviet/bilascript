# BilaScript v4 development line

## Stage 1 / v3.6 — Compile-time Safety

Strict mode turns unresolved standard aliases into compile-time errors. Type annotations such as `bilb ds: Magz<Sob>` are erased before JavaScript code generation and exist only to prove lowering safety. No runtime translator/helper is introduced.

MIT License · Copyright © 2026 Long Ngo · based on CVNSS4.0.

## Stage 2 / v3.7 — Tooling & Language Service

Adds native Bila language-service primitives, a minimal LSP stdio server, VS Code language metadata, and an optional offline TypeScript oracle. TypeScript is advisory; Bila remains the source of truth for CVNSS4.0 semantics and alias safety.

## Stage 3 / v3.8 — Modern JavaScript Grammar

Adds Bila-owned parsing/codegen for classes, ESM import/export, destructuring, plus async/await structural support. Arrow, optional chaining, nullish, spread/rest and template syntax remain symbol-compatible. JavaScript-standard structural words without a frozen CVNSS4.0 canonical form remain explicit passthrough tokens rather than guessed translations.

## Loop 4 / v4.0.0 — Conformance Hardening

V4 adds a negative strict corpus, deterministic differential testing, zero-helper audit and explicit non-claims. It is an evidence-driven frontend: lowering is allowed only when compile-time evidence is sufficient.

## Architecture ownership model

`src/architecture-metrics.js` is the single source of truth for the conceptual BilaScript ↔ JavaScript/Host ownership model used by the GitHub Pages visualization. The documented presets are 45/55 (equal six-layer weighting), 57/43 (language-core weighting), and 42/58 (runtime-heavy weighting). These numbers are architectural interpretation aids, not source-line percentages, runtime benchmarks, or ECMAScript conformance scores.

The site visualizer at `../site/architecture-ratio-3d.js` now uses **zero-CDN CSS 3D**. It imports only the local architecture model, builds the six 3D layers with browser-native CSS transforms, and provides drag-to-rotate, wheel zoom, auto-rotation, reset, and layer inspection without Three.js, OrbitControls, WebGL, unpkg, jsDelivr, or esm.sh. `test/architecture-metrics.test.js` guards both the published ratios and the no-external-3D-CDN contract.
